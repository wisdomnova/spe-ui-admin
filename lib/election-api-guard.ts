import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertElectionUnlockedOrNoPassword } from "@/lib/election-access";

/** Admin session + optional per-election password unlock (Bearer JWT). */
export async function requireSessionAndElectionUnlock(
  req: NextRequest,
  electionId: string
): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return assertElectionUnlockedOrNoPassword(req, electionId);
}
