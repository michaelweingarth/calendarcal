import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.calendarEvent.findMany({
    where: { userId: session.user.id },
    include: { calendar: true },
    orderBy: { startTime: "asc" },
  });

  const conflicts = [] as typeof events;

  for (let i = 0; i < events.length; i++) {
    const current = events[i];
    const next = events[i + 1];

    if (next && new Date(current.endTime) > new Date(next.startTime)) {
      conflicts.push(current, next);
    }
  }

  const uniqueConflicts = Array.from(new Map(conflicts.map((event) => [event.id, event])).values());

  return NextResponse.json({ conflicts: uniqueConflicts });
}
