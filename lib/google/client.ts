type CalendarListResponse = {
  items?: Array<{
    id?: string;
    primary?: boolean;
  }>;
};

export async function fetchGoogleCalendarAccountId(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=owner",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch Google Calendar list: ${text}`);
  }

  const data = (await response.json()) as CalendarListResponse;
  const primaryCalendar = data.items?.find((item) => item.primary) ??
    data.items?.[0];

  if (!primaryCalendar?.id) {
    throw new Error("Unable to determine Google Calendar account id");
  }

  return primaryCalendar.id;
}
