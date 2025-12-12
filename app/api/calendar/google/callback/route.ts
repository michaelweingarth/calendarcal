import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { fetchGoogleCalendarAccountId } from "@/lib/google/client";
import { exchangeCodeForTokens } from "@/lib/google/oauth";
import { prisma } from "@/lib/prisma";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: Request) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const redirectUrl = new URL("/account/calendars", appUrl);

  if (error) {
    redirectUrl.searchParams.set("error", error);
    return NextResponse.redirect(redirectUrl);
  }

  if (!session.user) {
    redirectUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const providerAccountId = await fetchGoogleCalendarAccountId(tokens.accessToken);

    const existingAccount = await prisma.calendarAccount.findFirst({
      where: {
        userId: session.user.id,
        provider: "google",
        providerAccountId,
      },
    });

    if (existingAccount) {
      await prisma.calendarAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt ?? null,
        },
      });
    } else {
      await prisma.calendarAccount.create({
        data: {
          userId: session.user.id,
          provider: "google",
          providerAccountId,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt ?? null,
        },
      });
    }

    redirectUrl.searchParams.set("connected", "google");
    return NextResponse.redirect(redirectUrl);
  } catch (callbackError) {
    console.error(callbackError);
    redirectUrl.searchParams.set("error", "google_oauth_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
