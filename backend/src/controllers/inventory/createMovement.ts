import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";
import { $Enums } from "prisma/main-db/client";

export async function createMovementController(c: Context) {

  try {

    const data = await c.req.json() as Validator["CreateInventoryMovement"];

    const user = getAuthUser(c)!;

    const productId = idParser.decode(data.productId);

    const warehouseId = idParser.decode(data.warehouseId);

    if (productId === null)
      return c.json({ success: false, message: "Invalid product ID" }, 400);

    if (warehouseId === null)
      return c.json({ success: false, message: "Invalid warehouse ID" }, 400);

    const toWarehouseId = data.toWarehouseId ? idParser.decode(data.toWarehouseId) : null;

    const referenceId = data.referenceId ? idParser.decode(data.referenceId) : null;

    const product = await prisma.product.findFirst({
      where: { id: productId, isDeleted: false },
    });
    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }

    let inventoryItem = await prisma.inventoryItem.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
    });

    if (!inventoryItem) {
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          productId,
          warehouseId,
          availableQuantity: 0,
          reservedQuantity: 0,
          damagedQuantity: 0,
          minimumStockLevel: 0,
        },
      });
    }

    // For non-ADJUST movements, quantity must be > 0
    if (data.quantity === 0 && data.type !== "ADJUST") {
      return c.json({ success: false, message: "Quantity must be greater than 0 for this movement type" }, 400);
    }

    let newQuantity = inventoryItem.availableQuantity;
    switch (data.type) {
      case "IN":
      case "RETURN":
        newQuantity += data.quantity;
        break;
      case "OUT":
        if (inventoryItem.availableQuantity < data.quantity) {
          return c.json({ success: false, message: "Insufficient stock for this operation" }, 400);
        }
        newQuantity -= data.quantity;
        break;
      case "ADJUST":
        newQuantity = data.quantity;
        break;
      case "TRANSFER":
        if (!data.toWarehouseId) {
          return c.json({ success: false, message: "Destination warehouse required for transfers" }, 400);
        }
        if (inventoryItem.availableQuantity < data.quantity) {
          return c.json({ success: false, message: "Insufficient stock for transfer" }, 400);
        }
        newQuantity -= data.quantity;
        break;
    }

    // Maximum stock level check for operations that increase source stock
    if (
      (data.type === "IN" || data.type === "RETURN" || data.type === "ADJUST") &&
      inventoryItem.maximumStockLevel !== null &&
      newQuantity > inventoryItem.maximumStockLevel
    ) {
      return c.json({
        success: false,
        message: `This operation would exceed the maximum stock level of ${inventoryItem.maximumStockLevel}. Resulting quantity would be ${newQuantity}.`,
      }, 400);
    }

    // For transfers, check that destination won't exceed its max stock level
    if (data.type === "TRANSFER" && toWarehouseId) {
      const destItem = await prisma.inventoryItem.findUnique({
        where: { productId_warehouseId: { productId, warehouseId: toWarehouseId } },
      });
      if (destItem && destItem.maximumStockLevel !== null) {
        const destNewQty = destItem.availableQuantity + data.quantity;
        if (destNewQty > destItem.maximumStockLevel) {
          return c.json({
            success: false,
            message: `Transfer would exceed destination warehouse's maximum stock level of ${destItem.maximumStockLevel}. Current: ${destItem.availableQuantity}, Transfer: ${data.quantity}, Max: ${destItem.maximumStockLevel}.`,
          }, 400);
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: inventoryItem!.id },
        data: {
          availableQuantity: newQuantity,
          ...(data.type === "IN" || data.type === "RETURN"
            ? { lastRestockedAt: new Date() }
            : {}),
        },
      });

      if (data.type === "TRANSFER" && toWarehouseId) {
        let destItem = await tx.inventoryItem.findUnique({
          where: {
            productId_warehouseId: {
              productId: productId,
              warehouseId: toWarehouseId,
            },
          },
        });

        if (destItem) {
          await tx.inventoryItem.update({
            where: { id: destItem.id },
            data: { availableQuantity: destItem.availableQuantity + data.quantity },
          });
        } else {
          await tx.inventoryItem.create({
            data: {
              productId: productId,
              warehouseId: toWarehouseId,
              availableQuantity: data.quantity,
            },
          });
        }
      }

      const movement = await tx.inventoryMovement.create({
        data: {
          productId: productId,
          warehouseId: warehouseId,
          type: data.type,
          quantity: data.quantity,
          referenceType: data.referenceType,
          referenceId: referenceId,
          performedBy: user.id,
          notes: data.notes,
          fromWarehouseId: data.type === "TRANSFER" ? warehouseId : null,
          toWarehouseId: toWarehouseId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
          performedByUser: { select: { id: true, name: true } },
        },
      });

      return movement;
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "InventoryMovement",
      entityId: result.id,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });


    const res: CreateMovementRes = {
      id: idParser.encode(result.id),
      createdAt: result.createdAt,
      warehouseId: idParser.encode(result.warehouseId),
      productId: idParser.encode(result.productId),
      type: result.type,
      quantity: result.quantity,
      referenceType: result.referenceType,
      referenceId: result.referenceId ? idParser.encode(result.referenceId) : null,
      performedBy: idParser.encode(result.performedBy),
      notes: result.notes,
      fromWarehouseId: result.fromWarehouseId ? idParser.encode(result.fromWarehouseId) : null,
      toWarehouseId: result.toWarehouseId ? idParser.encode(result.toWarehouseId) : null,
      product: {
        id: idParser.encode(result.product.id),
        name: result.product.name,
        sku: result.product.sku,
      },
      performedByUser: {
        id: idParser.encode(result.performedByUser.id),
        name: result.performedByUser.name,
      },
      warehouse: {
        id: idParser.encode(result.warehouse.id),
        name: result.warehouse.name,
      }
    }

    return c.json({ success: true, data: res }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}


type CreateMovementRes = {
  id: string;
  createdAt: Date;
  warehouseId: string;
  productId: string;
  type: $Enums.MovementType;
  quantity: number;
  referenceType: $Enums.ReferenceType;
  referenceId: string | null;
  performedBy: string;
  notes: string | null;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  product: {
    id: string;
    name: string;
    sku: string | null;
  };
  warehouse: {
    id: string;
    name: string;
  };
  performedByUser: {
    id: string;
    name: string;
  };
}