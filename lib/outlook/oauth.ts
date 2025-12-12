const MICROSOFT_AUTH_BASE = "https://login.microsoftonline.com";
const MICROSOFT_TOKEN_PATH = "/oauth2/v2.0/token";
const MICROSOFT_AUTH_PATH = "/oauth2/v2.0/authorize";

const calendarScopes = "offline_access Mail.Read Calendars.Read";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

function getTenantId() {
  return requiredEnv("MS_TENANT_ID");
}

export function getOutlookRedirectUri() {
  const appUrl = requiredEnv("NEXT_PUBLIC_APP_URL");
  return `${appUrl.replace(/\/$/, "")}/api/calendar/outlook/callback`;
}

export function getOutlookAuthUrl(state?: string) {
  const tenantId = getTenantId();
  const clientId = requiredEnv("MS_CLIENT_ID");
  const redirectUri = getOutlookRedirectUri();

  const url = new URL(`${MICROSOFT_AUTH_BASE}/${tenantId}${MICROSOFT_AUTH_PATH}`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", calendarScopes);

  if (state) {
    url.searchParams.set("state", state);
  }

  return url.toString();
}

type MicrosoftTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

export type OutlookTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
};

export async function exchangeOutlookCodeForTokens(code: string): Promise<OutlookTokens> {
  const tenantId = getTenantId();
  const clientId = requiredEnv("MS_CLIENT_ID");
  const clientSecret = requiredEnv("MS_CLIENT_SECRET");
  const redirectUri = getOutlookRedirectUri();

  const url = `${MICROSOFT_AUTH_BASE}/${tenantId}${MICROSOFT_TOKEN_PATH}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      scope: calendarScopes,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to exchange code for Outlook tokens: ${text}`);
  }

  const data = (await response.json()) as MicrosoftTokenResponse;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
  };
}

export async function refreshOutlookAccessToken(
  refreshToken: string
): Promise<OutlookTokens> {
  const tenantId = getTenantId();
  const clientId = requiredEnv("MS_CLIENT_ID");
  const clientSecret = requiredEnv("MS_CLIENT_SECRET");

  const url = `${MICROSOFT_AUTH_BASE}/${tenantId}${MICROSOFT_TOKEN_PATH}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: calendarScopes,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to refresh Outlook access token: ${text}`);
  }

  const data = (await response.json()) as MicrosoftTokenResponse;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
  };
}
