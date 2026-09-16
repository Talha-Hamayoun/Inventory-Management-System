import { PrismaClient } from "./client";
import { hash } from "bcryptjs";

import { PrismaClient as MainPrismaClient } from "../../prisma/main-db/client/client";
import { PrismaPg } from '@prisma/adapter-pg'


const globalForPrisma = global as unknown as { prisma: MainPrismaClient | undefined };

const mainAdapter = new PrismaPg({ connectionString: process.env.MAIN_DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ??
  new MainPrismaClient({
    adapter: mainAdapter as any
  });


async function main() {
  console.log("🌱 Starting database seed...\n");

  // Create Roles
  console.log("Creating roles...");
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      permissions: ["*"], // Full access
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "Inventory Manager" },
    update: {},
    create: {
      name: "Inventory Manager",
      permissions: [
        "products:read",
        "products:create",
        "products:update",
        "categories:read",
        "categories:create",
        "categories:update",
        "warehouses:read",
        "suppliers:read",
        "suppliers:create",
        "suppliers:update",
        "inventory:read",
        "inventory:create",
        "inventory:update",
        "inventory:adjust",
        "purchase-orders:read",
        "purchase-orders:create",
        "purchase-orders:update",
        "purchase-orders:receive",
        "reservations:read",
        "reservations:create",
        "reservations:update",
        "returns:read",
        "returns:create",
        "alerts:read",
        "alerts:create",
        "alerts:update",
        "audit:read",
      ],
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: "Viewer" },
    update: {},
    create: {
      name: "Viewer",
      permissions: [
        "products:read",
        "categories:read",
        "warehouses:read",
        "suppliers:read",
        "inventory:read",
        "purchase-orders:read",
        "reservations:read",
        "returns:read",
        "alerts:read",
      ],
    },
  });

  console.log(`  ✓ Created roles: Admin, Inventory Manager, Viewer`);

  // Create Admin User
  console.log("\nCreating admin user...");
  const hashedPassword = await hash("admin123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@inventory.local" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@inventory.local",
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log(`  ✓ Created admin user: admin@inventory.local (password: admin123)`);

  // Create sample Categories
  console.log("\nCreating categories...");
  const electronicsCategory = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Electronics",
      description: "Electronic devices and accessories",
      isActive: true,
    },
  });

  const clothingCategory = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "Clothing",
      description: "Apparel and accessories",
      isActive: true,
    },
  });

  const officeCategory = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: "Office Supplies",
      description: "Office and stationery items",
      isActive: true,
    },
  });

  const furnitureCategory = await prisma.category.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: "Furniture",
      description: "Office and home furniture",
      isActive: true,
    },
  });

  const hardwareCategory = await prisma.category.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      name: "Hardware",
      description: "Tools and hardware items",
      isActive: true,
    },
  });

  console.log(`  ✓ Created categories: Electronics, Clothing, Office Supplies, Furniture, Hardware`);

  // Create Warehouses
  console.log("\nCreating warehouses...");
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Main Warehouse",
      address: "123 Main Street, City, Country",
      isActive: true,
    },
  });

  const secondaryWarehouse = await prisma.warehouse.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "Secondary Warehouse",
      address: "456 Second Avenue, City, Country",
      isActive: true,
    },
  });

  console.log(`  ✓ Created warehouses: Main Warehouse, Secondary Warehouse`);

  // Create Suppliers
  console.log("\nCreating suppliers...");
  const supplier1 = await prisma.supplier.upsert({
    where: { code: "TECHSUPPLY" },
    update: {},
    create: {
      name: "TechSupply Co.",
      email: "orders@techsupply.com",
      phone: "+1-555-0100",
      address: "789 Tech Park, Silicon Valley, CA",
      isActive: true,
      code: "TECHSUPPLY",
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { code: "GLOBALAPPAREL" },
    update: {},
    create: {
      name: "Global Apparel Ltd.",
      email: "wholesale@globalapparel.com",
      phone: "+1-555-0200",
      address: "321 Fashion District, New York, NY",
      isActive: true,
      code: "GLOBALAPPAREL",
    },
  });

  const supplier3 = await prisma.supplier.upsert({
    where: { code: "MODERNFURNITURE" },
    update: {},
    create: {
      name: "Modern Furniture Solutions",
      email: "sales@modernfurniture.com",
      phone: "+1-555-0300",
      address: "654 Designer Blvd, Los Angeles, CA",
      isActive: true,
      code: "MODERNFURNITURE",
    },
  });

  const supplier4 = await prisma.supplier.upsert({
    where: { code: "OFFICEESSENTIALS" },
    update: {},
    create: {
      name: "Office Essentials Inc.",
      email: "supply@officeessentials.com",
      phone: "+1-555-0400",
      address: "987 Business Park, Chicago, IL",
      isActive: true,
      code: "OFFICEESSENTIALS",
    },
  });

  console.log(`  ✓ Created suppliers: TechSupply Co., Global Apparel Ltd., Modern Furniture Solutions, Office Essentials Inc.`);

  // Create Sample Products
  console.log("\nCreating sample products...");

  // Electronics products
  const laptop = await prisma.product.upsert({
    where: { sku: "LAPTOP-001" },
    update: {},
    create: {
      name: "Business Laptop Pro",
      description: "High-performance laptop with Intel Core i7, 16GB RAM, 512GB SSD",
      sku: "LAPTOP-001",
      categoryId: electronicsCategory.id,
      status: "ACTIVE",
      unitOfMeasure: "PCS",
      barcode: "1234567890123",
    },
  });

  const smartphone = await prisma.product.upsert({
    where: { sku: "PHONE-001" },
    update: {},
    create: {
      name: "Smart Phone X12",
      description: "Latest smartphone with 5G, 128GB storage, AMOLED display",
      sku: "PHONE-001",
      categoryId: electronicsCategory.id,
      status: "ACTIVE",
      unitOfMeasure: "PCS",
      barcode: "1234567890124",
    },
  });

  const monitor = await prisma.product.upsert({
    where: { sku: "MONITOR-001" },
    update: {},
    create: {
      name: "4K USB-C Monitor",
      description: "27-inch 4K display with USB-C connectivity, 60Hz refresh rate",
      sku: "MONITOR-001",
      categoryId: electronicsCategory.id,
      status: "ACTIVE",
      unitOfMeasure: "PCS",
      barcode: "1234567890125",
    },
  });

  const keyboard = await prisma.product.upsert({
    where: { sku: "KEYBOARD-001" },
    update: {},
    create: {
      name: "Mechanical Gaming Keyboard",
      description: "RGB mechanical keyboard with Cherry MX switches",
      sku: "KEYBOARD-001",
      categoryId: electronicsCategory.id,
      status: "ACTIVE",
      unitOfMeasure: "PCS",
      barcode: "1234567890126",
    },
  });

  // Clothing products
  const tshirt = await prisma.product.upsert({
    where: { sku: "TSHIRT-001" },
    update: {},
    create: {
      name: "Classic Cotton T-Shirt",
      description: "100% cotton t-shirt available in multiple sizes and colors",
      sku: "TSHIRT-001",
      categoryId: clothingCategory.id,
      status: "ACTIVE",
      unitOfMeasure: "PCS",
      barcode: "1234567890127",
    },
  });

  const jeans = await prisma.product.upsert({
    where: { sku: "JEANS-001" },
    update: {},
    create: {
      name: "Premium Denim Jeans",
      description: "High-quality denim jeans with comfortable fit",
      sku: "JEANS-001",
      categoryId: clothingCategory.id,
      status: "ACTIVE",
      unitOfMeasure: "PCS",
      barcode: "1234567890128",
    },
  });

  // Office Furniture
  const deskChair = await prisma.product.upsert({
    where: { sku: "CHAIR-001" },
    update: {},
    create: {
      name: "Ergonomic Office Chair",
      description: "Adjustable ergonomic office chair with lumbar support",
      sku: "CHAIR-001",
      categoryId: furnitureCategory.id,
      status: "ACTIVE",
      unitOfMeasure: "PCS",
      barcode: "1234567890129",
    },
  });

  const desk = await prisma.product.upsert({
    where: { sku: "DESK-001" },
    update: {},
    create: {
      name: "Standing Desk Electric",
      description: "Adjustable electric standing desk with memory settings",
      sku: "DESK-001",
      categoryId: furnitureCategory.id,
      status: "ACTIVE",
      unitOfMeasure: "PCS",
      barcode: "1234567890130",
    },
  });

  // Office Supplies
  const notebook = await prisma.product.upsert({
    where: { sku: "NOTEBOOK-001" },
    update: {},
    create: {
      name: "Professional Notebook A4",
      description: "Premium quality A4 notebook with ruled pages",
      sku: "NOTEBOOK-001",
      categoryId: officeCategory.id,
      status: "ACTIVE",
      unitOfMeasure: "PCS",
      barcode: "1234567890131",
    },
  });

  const pen = await prisma.product.upsert({
    where: { sku: "PEN-001" },
    update: {},
    create: {
      name: "Ballpoint Pen Set",
      description: "Set of 12 quality ballpoint pens",
      sku: "PEN-001",
      categoryId: officeCategory.id,
      status: "ACTIVE",
      unitOfMeasure: "BOXES",
      barcode: "1234567890132",
    },
  });

  console.log(`  ✓ Created 10 sample products across all categories`);

  // Create Inventory Items
  console.log("\nCreating inventory items...");

  const inventoryData = [
    { product: laptop, mainQty: 25, secondaryQty: 15, minLevel: 5 },
    { product: smartphone, mainQty: 50, secondaryQty: 30, minLevel: 10 },
    { product: monitor, mainQty: 20, secondaryQty: 10, minLevel: 5 },
    { product: keyboard, mainQty: 100, secondaryQty: 50, minLevel: 20 },
    { product: tshirt, mainQty: 200, secondaryQty: 150, minLevel: 50 },
    { product: jeans, mainQty: 150, secondaryQty: 100, minLevel: 30 },
    { product: deskChair, mainQty: 30, secondaryQty: 20, minLevel: 5 },
    { product: desk, mainQty: 15, secondaryQty: 10, minLevel: 3 },
    { product: notebook, mainQty: 500, secondaryQty: 300, minLevel: 100 },
    { product: pen, mainQty: 1000, secondaryQty: 500, minLevel: 200 },
  ];

  for (const item of inventoryData) {
    // Main warehouse inventory
    await prisma.inventoryItem.upsert({
      where: {
        productId_warehouseId: {
          productId: item.product.id,
          warehouseId: mainWarehouse.id,
        },
      },
      update: {},
      create: {
        productId: item.product.id,
        warehouseId: mainWarehouse.id,
        availableQuantity: item.mainQty,
        reservedQuantity: Math.floor(item.mainQty * 0.1),
        damagedQuantity: Math.floor(item.mainQty * 0.05),
        minimumStockLevel: item.minLevel,
      },
    });

    // Secondary warehouse inventory
    await prisma.inventoryItem.upsert({
      where: {
        productId_warehouseId: {
          productId: item.product.id,
          warehouseId: secondaryWarehouse.id,
        },
      },
      update: {},
      create: {
        productId: item.product.id,
        warehouseId: secondaryWarehouse.id,
        availableQuantity: item.secondaryQty,
        reservedQuantity: Math.floor(item.secondaryQty * 0.1),
        damagedQuantity: 0,
        minimumStockLevel: Math.floor(item.minLevel * 0.8),
      },
    });
  }

  console.log(`  ✓ Created inventory items for all products in both warehouses`);

  // Create Stock Alerts
  console.log("\nCreating stock alerts...");

  // await prisma.stockAlert.upsert({
  //   where: {
  //     productId_variantId_warehouseId_alertType: {
  //       productId: laptop.id,
  //       variantId: null,
  //       warehouseId: mainWarehouse.id,
  //       alertType: "LOW_STOCK",
  //     },
  //   },
  //   update: {},
  //   create: {
  //     productId: laptop.id,
  //     warehouseId: mainWarehouse.id,
  //     alertType: "LOW_STOCK",
  //     threshold: 10,
  //     isActive: true,
  //   },
  // });

  console.log(`  ✓ Created stock alerts`);

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📋 Login credentials:");
  console.log("   Email: admin@inventory.local");
  console.log("   Password: admin123\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
