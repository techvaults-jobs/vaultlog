import { auth } from "@/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { getEffectiveServicePrice } from "@/lib/pricing";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "MANAGER"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const idCheck = z.string().uuid().safeParse(id);
    if (!idCheck.success) {
      return NextResponse.json({ error: "Invalid client id" }, { status: 400 });
    }

    const client = await db.query.clients.findFirst({
      where: eq(clients.id, id),
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const activeServices = await db.query.services.findMany({
      where: (fields, { eq }) => eq(fields.isActive, true),
    });

    const pricing = await Promise.all(
      activeServices.map(async (service) => {
        const price = await getEffectiveServicePrice({
          clientId: client.id,
          serviceId: service.id,
        });
        return {
          serviceId: service.id,
          serviceName: service.name,
          category: service.category,
          basePrice: price.basePrice,
          effectivePrice: price.effectivePrice,
          currency: price.currency,
          discountPercentage: price.discountPercentage,
          customFixedPrice: price.customFixedPrice,
        };
      })
    );

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        contractType: client.contractType,
      },
      pricing,
    });
  } catch (error) {
    console.error("Error fetching client pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch client pricing" },
      { status: 500 }
    );
  }
}

