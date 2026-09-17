"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/src/lib/api";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/src/components/ui/card";
import { LayoutBackground } from "@/src/components/layout-background";
import { Loader2, Mail } from "lucide-react";
import Image from "next/image";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!otp.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await authApi.verifyOtp({ email: email.trim(), otp: otp.trim() });
      if (response.data && response.data.success === true) {
        setVerified(true);
        return;
      }
      setError(
        (response.data && "message" in response.data && response.data.message) ||
          (response.error instanceof Error ? response.error.message : "Invalid verification code.")
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setError("");
    if (!email.trim()) {
      setError("Email is required to resend a code.");
      return;
    }

    setIsResending(true);
    try {
      const response = await authApi.resendOtp({ email: email.trim() });
      if (response.data && response.data.success === true) {
        const retryAfter =
          "retryAfter" in response.data && typeof response.data.retryAfter === "number"
            ? response.data.retryAfter
            : 60;
        setCooldown(retryAfter);
        return;
      }
      if (response.status === 429 && response.data && "retryAfter" in response.data && typeof response.data.retryAfter === "number") {
        setCooldown(response.data.retryAfter);
      }
      setError(
        (response.data && "message" in response.data && response.data.message) ||
          (response.error instanceof Error ? response.error.message : "Failed to resend verification code.")
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4">
      <LayoutBackground overlay="dark" />
      <Card className="relative z-10 w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/Logo2.png"
              alt="AutoLine"
              width={2172}
              height={724}
              className="h-14 w-auto max-w-60 object-contain"
              style={{ width: "auto", height: "3.5rem" }}
              priority
              unoptimized
            />
          </div>
          <CardTitle className="text-2xl">{verified ? "Request submitted" : "Verify Email"}</CardTitle>
          <CardDescription>
            {verified
              ? "An administrator will review your account."
              : "Enter the verification code sent to your email."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verified ? (
            <div className="space-y-4 text-center">
              <div className="bg-green-50 text-green-800 p-4 rounded-md text-sm whitespace-pre-line">
                {"Email verified successfully.\nYour account request has been submitted for approval.\nYou will receive an email once your account is approved."}
              </div>
              <Button type="button" className="w-full" onClick={() => router.push("/login")}>
                Go to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Verification code</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit OTP"
                  className="tracking-[0.3em] text-center text-lg"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verify OTP
              </Button>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isResending}
                className="w-full text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
              >
                {isResending
                  ? "Sending..."
                  : cooldown > 0
                    ? `Resend OTP in ${cooldown}s`
                    : "Resend OTP"}
              </button>
              <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                The code expires in 10 minutes.
              </p>
            </form>
          )}
        </CardContent>
        {!verified && (
          <CardFooter className="justify-center">
            <p className="text-sm text-gray-600">
              Already verified?{" "}
              <Link href="/login" className="text-blue-600 hover:underline cursor-pointer">
                Sign in
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
