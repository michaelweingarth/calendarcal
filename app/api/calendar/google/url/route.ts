import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/google/oauth";

export async function GET() {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = getGoogleAuthUrl(session.user.id);
    return NextResponse.json({ url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to generate Google OAuth URL" }, { status: 500 });
  }
}
