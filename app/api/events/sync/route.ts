import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { fetchGoogleEventsForAccount } from "@/lib/events/google";
import { fetchOutlookEventsForAccount } from "@/lib/events/outlook";
import { NormalizedEvent, toPrismaEventData } from "@/lib/events/normalize";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.calendarAccount.findMany({
    where: { userId: session.user.id },
  });

  const allEvents: NormalizedEvent[] = [];

  for (const account of accounts) {
    try {
      if (account.provider === "google") {
        allEvents.push(...(await fetchGoogleEventsForAccount(account)));
      } else if (account.provider === "outlook") {
        allEvents.push(...(await fetchOutlookEventsForAccount(account)));
      }
    } catch (error) {
      console.error(`Failed syncing ${account.provider} events`, error);
    }
  }

  let synced = 0;

  for (const event of allEvents) {
    await prisma.calendarEvent.upsert({
      where: { id: event.id },
      update: toPrismaEventData(event),
      create: toPrismaEventData(event),
    });
    synced += 1;
  }

  return NextResponse.json({ synced });
}
