import { auth } from "@/auth";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createServiceSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional().nullable(),
  basePrice: z.union([z.string(), z.number()]),
  slaHours: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const onlyActive = searchParams.get("active") === "true";

    const all = await db.query.services.findMany({
      where: (category || onlyActive)
        ? (fields, { and, eq }) =>
            and(
              category ? eq(fields.category, category) : undefined,
              onlyActive ? eq(fields.isActive, true) : undefined
            )
        : undefined,
    });

    return NextResponse.json(all);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { name, category, description, basePrice, slaHours, isActive } =
      parsed.data;

    const created = await db
      .insert(services)
      .values({
        name,
        category,
        description,
        basePrice: String(basePrice),
        slaHours,
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json(created[0], { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN"].includes(session.user?.role || "")) {
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
    const parsed = createServiceSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const { name, category, description, basePrice, slaHours, isActive } =
      parsed.data;
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (basePrice !== undefined) updateData.basePrice = String(basePrice);
    if (slaHours !== undefined) updateData.slaHours = slaHours;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await db
      .update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

