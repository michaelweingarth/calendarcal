import { CalendarAccount } from "@prisma/client";

export type NormalizedEvent = {
  id: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  sourceCalendar: string;
  calendarAccount: CalendarAccount;
};

export function shouldRefreshToken(expiresAt?: Date | null) {
  if (!expiresAt) return false;

  const bufferMs = 2 * 60 * 1000; // refresh 2 minutes before expiry
  return expiresAt.getTime() - bufferMs <= Date.now();
}

export function toPrismaEventData(event: NormalizedEvent) {
  return {
    id: event.id,
    userId: event.calendarAccount.userId,
    calendarId: event.calendarAccount.id,
    title: event.title || "(untitled)",
    description: event.description ?? null,
    startTime: event.startTime,
    endTime: event.endTime,
    sourceCalendar: event.sourceCalendar,
  };
}
