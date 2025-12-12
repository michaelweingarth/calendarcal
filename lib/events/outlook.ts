import { CalendarAccount } from "@prisma/client";

import { refreshOutlookAccessToken } from "@/lib/outlook/oauth";
import { prisma } from "@/lib/prisma";

import {
  NormalizedEvent,
  shouldRefreshToken,
} from "./normalize";

type OutlookEvent = {
  id?: string;
  subject?: string;
  bodyPreview?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  organizer?: { emailAddress?: { address?: string } };
};

type OutlookEventsResponse = {
  value?: OutlookEvent[];
};

async function ensureOutlookAccessToken(account: CalendarAccount) {
  if (!shouldRefreshToken(account.expiresAt)) {
    return account;
  }

  if (!account.refreshToken) {
    return account;
  }

  const tokens = await refreshOutlookAccessToken(account.refreshToken);
  const updated = await prisma.calendarAccount.update({
    where: { id: account.id },
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt ?? null,
    },
  });

  return updated;
}

function parseOutlookDate(value?: { dateTime?: string; timeZone?: string }) {
  if (!value?.dateTime) return undefined;
  return new Date(value.dateTime);
}

export async function fetchOutlookEventsForAccount(
  account: CalendarAccount
): Promise<NormalizedEvent[]> {
  const activeAccount = await ensureOutlookAccessToken(account);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const url = new URL("https://graph.microsoft.com/v1.0/me/calendarview");
  url.searchParams.set("startDateTime", startDate.toISOString());
  url.searchParams.set("endDateTime", endDate.toISOString());

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${activeAccount.accessToken}`,
      Prefer: 'outlook.timezone="UTC"',
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch Outlook events: ${text}`);
  }

  const data = (await response.json()) as OutlookEventsResponse;
  const items = data.value ?? [];

  return items
    .map((item) => {
      const start = parseOutlookDate(item.start);
      const end = parseOutlookDate(item.end);

      if (!start || !end || !item.id) return undefined;

      const title = item.subject ?? "(untitled)";

      return {
        id: `outlook:${item.id}`,
        title,
        description: item.bodyPreview ?? null,
        startTime: start,
        endTime: end,
        sourceCalendar:
          item.organizer?.emailAddress?.address ??
          activeAccount.providerAccountId,
        calendarAccount: activeAccount,
      } satisfies NormalizedEvent;
    })
    .filter((event): event is NormalizedEvent => Boolean(event));
}
