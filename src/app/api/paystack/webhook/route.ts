import { db } from "@/db";
import { contracts, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifySignature(payload: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      data: {
        reference: string;
        status: string;
        metadata?: {
          type?: string;
          ticketId?: string;
          contractId?: string;
          clientId?: string;
        };
      };
    };

    if (event.event === "charge.success" && event.data.status === "success") {
      const meta = event.data.metadata;
      if (meta?.type === "ticket" && meta.ticketId) {
        await db
          .update(tasks)
          .set({ status: "IN_PROGRESS" })
          .where(eq(tasks.id, meta.ticketId));
      }

      if (meta?.type === "contract" && meta.contractId) {
        await db
          .update(contracts)
          .set({ isActive: true })
          .where(eq(contracts.id, meta.contractId));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling Paystack webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

