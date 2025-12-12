import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const tokenRecord = await prisma.magicLinkToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (tokenRecord.expiresAt.getTime() < Date.now()) {
      await prisma.magicLinkToken.delete({ where: { id: tokenRecord.id } });
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { email: tokenRecord.email },
      update: { emailVerified: true },
      create: {
        email: tokenRecord.email,
        emailVerified: true,
      },
    });

    await prisma.magicLinkToken.delete({ where: { id: tokenRecord.id } });

    const session = await getSession();
    session.user = { id: user.id, email: user.email };
    await session.save();

    return NextResponse.json({ user: session.user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to verify token" }, { status: 500 });
  }
}
