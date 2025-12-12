type MicrosoftUserResponse = {
  id?: string;
  userPrincipalName?: string;
};

export async function fetchOutlookAccountId(accessToken: string) {
  const response = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch Outlook account: ${text}`);
  }

  const data = (await response.json()) as MicrosoftUserResponse;

  if (!data.id) {
    throw new Error("Unable to determine Outlook account id");
  }

  return data.id;
}
