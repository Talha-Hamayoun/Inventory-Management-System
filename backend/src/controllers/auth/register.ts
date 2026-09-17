import { Context } from "hono";
import { hash } from "bcryptjs";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";
import { issueEmailOtp } from "../../lib/emailOtp";
import { otpEmail, sendEmail } from "../../lib/email";

export async function registerController(c: Context) {
  try {
    const data = await c.req.json() as Validator["Register"];

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      if (existingUser.accountStatus === "PENDING_EMAIL_VERIFICATION" && !existingUser.emailVerified) {
        const issued = await issueEmailOtp(existingUser.id);
        if (!issued.ok) {
          return c.json({
            success: false,
            message: `Please wait ${issued.retryAfter} seconds before requesting another code.`,
          }, 429);
        }
        const mail = otpEmail(existingUser.name, issued.code!);
        await sendEmail({ to: existingUser.email, ...mail });
        return c.json({
          success: true,
          data: {
            email: existingUser.email,
            requiresVerification: true,
          },
        }, 200);
      }
      return c.json({ success: false, message: "User with this email already exists" }, 409);
    }

    const viewerRole = await prisma.role.findFirst({
      where: { name: "Viewer" },
    });
    if (!viewerRole) {
      return c.json({ success: false, message: "Default role not found. Please seed the database." }, 500);
    }

    const hashedPassword = await hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        roleId: viewerRole.id,
        isActive: false,
        emailVerified: false,
        accountStatus: "PENDING_EMAIL_VERIFICATION",
      },
    });

    const issued = await issueEmailOtp(user.id);
    if (issued.ok && issued.code) {
      const mail = otpEmail(user.name, issued.code);
      await sendEmail({ to: user.email, ...mail });
    }

    return c.json(
      {
        success: true,
        data: {
          email: user.email,
          requiresVerification: true,
          id: idParser.encode(user.id),
        },
      },
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ success: false, message: "Registration failed. Please try again." }, 500);
  }
}
