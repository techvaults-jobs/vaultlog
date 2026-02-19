import { db } from "@/db";
import { pricingOverrides, services } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function getEffectiveServicePrice(params: {
  clientId: string;
  serviceId: string;
}): Promise<{
  currency: "NGN";
  basePrice: string;
  effectivePrice: string;
  discountPercentage?: string;
  customFixedPrice?: string;
}> {
  const { clientId, serviceId } = params;

  const service = await db.query.services.findFirst({
    where: eq(services.id, serviceId),
  });
  if (!service) {
    throw new Error("Service not found");
  }

  const override = await db.query.pricingOverrides.findFirst({
    where: and(
      eq(pricingOverrides.clientId, clientId),
      eq(pricingOverrides.serviceId, serviceId)
    ),
  });

  const basePrice = Number(service.basePrice);
  if (!Number.isFinite(basePrice)) {
    throw new Error("Invalid service base price");
  }

  if (override?.customFixedPrice !== null && override?.customFixedPrice !== undefined) {
    return {
      currency: "NGN",
      basePrice: service.basePrice,
      effectivePrice: override.customFixedPrice,
      discountPercentage: override.discountPercentage ?? undefined,
      customFixedPrice: override.customFixedPrice,
    };
  }

  const discountPctRaw = override?.discountPercentage;
  const discountPct =
    discountPctRaw !== null && discountPctRaw !== undefined
      ? Number(discountPctRaw)
      : undefined;

  if (discountPct !== undefined) {
    const factor = 1 - discountPct / 100;
    const effective = Math.max(0, basePrice * factor);
    return {
      currency: "NGN",
      basePrice: service.basePrice,
      effectivePrice: effective.toFixed(2),
      discountPercentage: override?.discountPercentage ?? undefined,
      customFixedPrice: undefined,
    };
  }

  return {
    currency: "NGN",
    basePrice: service.basePrice,
    effectivePrice: service.basePrice,
  };
}

