import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubchamberSubscriptionValidator } from "@/lib/validators/subchamber";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { subchamberId } = SubchamberSubscriptionValidator.parse(body);

    const subscriptionExists = await db.subscription.findFirst({
      where: {
        subchamberId,
        userId: session.user.id,
      },
    });

    if (!subscriptionExists) {
      return new Response(
        "You've not been subscribed to this subchamber, yet.",
        {
          status: 400,
        }
      );
    }

    await db.subscription.delete({
      where: {
        userId_subchamberId: {
          subchamberId,
          userId: session.user.id,
        },
      },
    });

    return new Response(subchamberId);
  } catch (error) {
    error;
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 });
    }

    return new Response(
      "Could not unsubscribe from subchamber at this time. Please try later",
      { status: 500 }
    );
  }
}
