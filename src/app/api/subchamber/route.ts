import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubchamberValidator } from "@/lib/validators/subchamber";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name } = SubchamberValidator.parse(body);

    const subchamberExists = await db.subchamber.findFirst({
      where: { name },
    });

    if (subchamberExists) {
      return new Response("Subchamber already exists", { status: 409 });
    }

    const subchamber = await db.subchamber.create({
      data: {
        name,
        creatorId: session.user.id,
      },
    });

    await db.subscription.create({
      data: {
        userId: session.user.id,
        subchamberId: subchamber.id,
      },
    });

    return new Response(subchamber.name);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return new Response(err.message, { status: 422 });
    }

    return new Response("could not create subchamber", { status: 500 });
  }
}
