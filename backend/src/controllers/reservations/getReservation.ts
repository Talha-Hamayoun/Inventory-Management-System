import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getReservationController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);

    if (id === null) {
      return c.json({ success: false, message: "Invalid reservation ID" }, 400);
    }

    const reservation = await prisma.stockReservation.findUnique({
      where: { id },
      include: {
        product: true,
        warehouse: true,
      },
    });

    if (!reservation) {
      return c.json({ success: false, message: "Reservation not found" }, 404);
    }

    const responseReservation = {
      ...reservation,
      reservationNumber: `RES-${String(reservation.id).padStart(6, "0")}`,
      id: idParser.encode(reservation.id),
      product: {
        ...reservation.product,
        id: idParser.encode(reservation.product.id),
      },
      warehouse: {
        ...reservation.warehouse,
        id: idParser.encode(reservation.warehouse.id),
      },
    };

    return c.json({ success: true, data: responseReservation });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
