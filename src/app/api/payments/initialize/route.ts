import { auth } from "@/auth";
import { db } from "@/db";
import { contracts, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const initializeSchema = z.object({
  ticketId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = initializeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { ticketId, contractId, email } = parsed.data;

    if (!ticketId && !contractId) {
      return NextResponse.json(
        { error: "Either ticketId or contractId is required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "PAYSTACK_SECRET_KEY is not configured" },
        { status: 500 }
      );
    }

    let amountNaira = 0;
    let metadata: Record<string, unknown> = {};

    if (ticketId) {
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, ticketId),
      });
      if (!task || !task.fixedPrice) {
        return NextResponse.json(
          { error: "Ticket not found or not billable" },
          { status: 404 }
        );
      }
      amountNaira = Number(task.fixedPrice);
      metadata = {
        type: "ticket",
        ticketId,
        clientId: task.clientId,
      };
    }

    if (contractId) {
      const contract = await db.query.contracts.findFirst({
        where: eq(contracts.id, contractId),
      });
      if (!contract || !contract.monthlyFee) {
        return NextResponse.json(
          { error: "Contract not found or not billable" },
          { status: 404 }
        );
      }
      amountNaira = Number(contract.monthlyFee);
      metadata = {
        type: "contract",
        contractId,
        clientId: contract.clientId,
      };
    }

    if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
      return NextResponse.json(
        { error: "Invalid billing amount" },
        { status: 400 }
      );
    }

    const amountKobo = Math.round(amountNaira * 100);

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        metadata,
        currency: "NGN",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Paystack init error:", data);
      return NextResponse.json(
        { error: "Failed to initialize payment" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        authorizationUrl: data.data?.authorization_url,
        reference: data.data?.reference,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error initializing payment:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}

