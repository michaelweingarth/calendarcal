import { CalendarAccount } from "@prisma/client";

import {
  refreshGoogleAccessToken,
} from "@/lib/google/oauth";
import { prisma } from "@/lib/prisma";

import {
  NormalizedEvent,
  shouldRefreshToken,
} from "./normalize";

type GoogleEventItem = {
  id?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type GoogleEventsResponse = {
  items?: GoogleEventItem[];
};

async function ensureGoogleAccessToken(account: CalendarAccount) {
  if (!shouldRefreshToken(account.expiresAt)) {
    return account;
  }

  if (!account.refreshToken) {
    return account;
  }

  const tokens = await refreshGoogleAccessToken(account.refreshToken);
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

function parseGoogleDate(value?: { dateTime?: string; date?: string }) {
  if (!value) return undefined;
  if (value.dateTime) return new Date(value.dateTime);
  if (value.date) return new Date(`${value.date}T00:00:00Z`);
  return undefined;
}

export async function fetchGoogleEventsForAccount(
  account: CalendarAccount
): Promise<NormalizedEvent[]> {
  const activeAccount = await ensureGoogleAccessToken(account);

  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 30);

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      activeAccount.providerAccountId
    )}/events`
  );
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("timeMin", timeMin.toISOString());
  url.searchParams.set("timeMax", timeMax.toISOString());

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${activeAccount.accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch Google events: ${text}`);
  }

  const data = (await response.json()) as GoogleEventsResponse;
  const items = data.items ?? [];

  return items
    .map((item) => {
      const start = parseGoogleDate(item.start);
      const end = parseGoogleDate(item.end);

      if (!start || !end || !item.id) return undefined;

      const title = item.summary ?? "(untitled)";

      return {
        id: `google:${item.id}`,
        title,
        description: item.description ?? null,
        startTime: start,
        endTime: end,
        sourceCalendar: activeAccount.providerAccountId,
        calendarAccount: activeAccount,
      } satisfies NormalizedEvent;
    })
    .filter((event): event is NormalizedEvent => Boolean(event));
}
