import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function updateCategoryController(c: Context) {

    try {

        const hashedId = c.req.param("id");
        const id = idParser.decode(hashedId);
        const data = await c.req.json() as Validator["UpdateCategory"];
        const user = getAuthUser(c)!;

        if (id === null)
            return c.json({ success: false, message: "Invalid category ID" }, 400);

        let parentId = null;
        if (data.parentId) {
            parentId = idParser.decode(data.parentId);
            if (parentId === null)
                return c.json({ success: false, message: "Invalid parent category ID" }, 400);
        }

        const existing = await prisma.category.findUnique({ where: { id } });

        if (!existing)
            return c.json({ success: false, message: "Category not found" }, 404);

        if (parentId === id)
            return c.json({ success: false, message: "Category cannot be its own parent" }, 400);

        let parentCategory = null;

        if (parentId) {
            parentCategory = await prisma.category.findUnique({ where: { id: parentId } })

            if (!parentCategory)
                return c.json({ success: false, message: "Parent category not found" }, 404);

        }

        const duplicate = await prisma.category.findFirst({
            where: { name: data.name, parentId, id: { not: id } },
        });

        if (duplicate)
            return c.json({ success: false, message: "A category with this name already exists" }, 409);

        const category = await prisma.category.update({
            where: { id },
            data: { ...data, parentId },
            include: { parent: { select: { id: true, name: true } } },
        });

        await createAuditLog({
            userId: user.id,
            action: "UPDATE",
            entityType: "Category",
            entityId: id,
            oldValues: existing as unknown as Record<string, unknown>,
            newValues: data,
            ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
            userAgent: c.req.header("user-agent"),
        });

            const responseCategory = {
            ...category,
            id: idParser.encode(category.id),
            parent: category.parent ? {
                ...category.parent,
                id: idParser.encode(category.parent.id),
            } : null,
        };

        return c.json({ success: true, data: responseCategory });
    } catch (error) {
        console.error("Error updating category:", error);
        return c.json({ success: false, message: "Server error" }, 500);
    }
}
