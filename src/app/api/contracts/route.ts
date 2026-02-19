import { auth } from "@/auth";
import { db } from "@/db";
import { contracts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createContractSchema = z.object({
  clientId: z.string().uuid(),
  contractType: z.enum(["MONTHLY", "QUARTERLY", "BI_ANNUAL", "ANNUAL"]),
  supportTierName: z.string().min(1),
  monthlyFee: z.union([z.string(), z.number()]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  paystackPlanCode: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "MANAGER"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId") || undefined;
    const activeOnly = searchParams.get("active") === "true";

    const all = await db.query.contracts.findMany({
      where: (clientId || activeOnly)
        ? (fields, { and, eq }) =>
            and(
              clientId ? eq(fields.clientId, clientId) : undefined,
              activeOnly ? eq(fields.isActive, true) : undefined
            )
        : undefined,
      with: {
        client: true,
      },
    });

    return NextResponse.json(all);
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createContractSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const {
      clientId,
      contractType,
      supportTierName,
      monthlyFee,
      startDate,
      endDate,
      isActive,
      paystackPlanCode,
    } = parsed.data;

    const created = await db
      .insert(contracts)
      .values({
        clientId,
        contractType,
        supportTierName,
        monthlyFee: String(monthlyFee),
        startDate,
        endDate,
        isActive: isActive ?? true,
        paystackPlanCode: paystackPlanCode ?? null,
      })
      .returning();

    return NextResponse.json(created[0], { status: 201 });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: "Failed to create contract" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const idCheck = z.string().uuid().safeParse(id);
    if (!idCheck.success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = createContractSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const {
      clientId,
      contractType,
      supportTierName,
      monthlyFee,
      startDate,
      endDate,
      isActive,
      paystackPlanCode,
    } = parsed.data;

    if (clientId !== undefined) updateData.clientId = clientId;
    if (contractType !== undefined) updateData.contractType = contractType;
    if (supportTierName !== undefined) updateData.supportTierName = supportTierName;
    if (monthlyFee !== undefined) updateData.monthlyFee = String(monthlyFee);
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (paystackPlanCode !== undefined) {
      updateData.paystackPlanCode = paystackPlanCode;
    }

    const updated = await db
      .update(contracts)
      .set(updateData)
      .where(eq(contracts.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating contract:", error);
    return NextResponse.json(
      { error: "Failed to update contract" },
      { status: 500 }
    );
  }
}

