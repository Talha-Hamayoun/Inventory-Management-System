import { PrismaClient as MainPrismaClient } from "../../prisma/main-db/client/client";
import { PrismaPg } from '@prisma/adapter-pg'


const globalForPrisma = global as unknown as { prisma: MainPrismaClient | undefined };

const mainAdapter = new PrismaPg({ connectionString: process.env.MAIN_DATABASE_URL });

export const prisma =
    globalForPrisma.prisma ??
    new MainPrismaClient({
        adapter: mainAdapter as any
    });

if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;