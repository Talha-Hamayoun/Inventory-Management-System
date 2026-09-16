import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getCategoryTreeController(c: Context) {
  try {
    const data = await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: { where: { isActive: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const encodedData = data.map((category) => {
      return {
        ...category,
        id: idParser.encode(category.id),
        children: category.children.map(child=>{
            return{
                ...child,
                id: idParser.encode(child.id),
            }
        }),
      };
    });

    return c.json({ success: true, data: encodedData });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
