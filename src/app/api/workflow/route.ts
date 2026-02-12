import { auth } from "@/auth";
import { WORKFLOW_RULES } from "@/lib/workflow";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      allowedTransitions: WORKFLOW_RULES.allowedTransitions,
      wipLimits: WORKFLOW_RULES.wipLimits,
      slaTargetsHours: WORKFLOW_RULES.slaTargetsHours,
    });
  } catch (error) {
    console.error("Error fetching workflow rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow rules" },
      { status: 500 }
    );
  }
}
