import { IronSessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";

export type SessionUser = {
  id: string;
  email: string;
};

export type SessionData = {
  user?: SessionUser;
};

const sessionPassword = process.env.IRON_SESSION_PASSWORD;

if (!sessionPassword) {
  throw new Error("IRON_SESSION_PASSWORD is not set");
}

const sessionOptions: IronSessionOptions = {
  password: sessionPassword,
  cookieName: process.env.IRON_SESSION_COOKIE_NAME ?? "calendarcal_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export const getSession = () => getIronSession<SessionData>(cookies(), sessionOptions);
