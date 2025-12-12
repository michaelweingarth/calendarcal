"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { cn } from "@/lib/utils";

type CalendarAccount = {
  id: string;
  provider: string;
  providerAccountId: string;
  createdAt: string;
  sourceCalendar?: string | null;
};

type AccountsResponse = {
  accounts: CalendarAccount[];
};

type SyncResponse = {
  synced: number;
};

type FetchState = "idle" | "loading" | "error";

export default function CalendarAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [status, setStatus] = useState<FetchState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<FetchState>("idle");

  useEffect(() => {
    async function loadAccounts() {
      try {
        setStatus("loading");
        const response = await fetch("/api/calendar/accounts", { cache: "no-store" });
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Unable to load calendar accounts");
        }
        const payload = (await response.json()) as AccountsResponse;
        setAccounts(payload.accounts ?? []);
        setStatus("idle");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    }

    loadAccounts();
  }, [router]);

  const hasAccounts = useMemo(() => accounts.length > 0, [accounts]);

  const handleConnect = async (provider: "google" | "outlook") => {
    setMessage(null);
    try {
      const response = await fetch(`/api/calendar/${provider}/url`);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to get ${provider} auth URL`);
      }
      const { url } = (await response.json()) as { url?: string };
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error(error);
      setMessage(`Unable to start ${provider} connection. Please try again.`);
    }
  };

  const handleSync = async () => {
    setMessage(null);
    try {
      setSyncState("loading");
      const response = await fetch("/api/events/sync", { method: "POST" });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to sync events");
      }
      const payload = (await response.json()) as SyncResponse;
      setMessage(`Synced ${payload.synced} events.`);
      setSyncState("idle");
    } catch (error) {
      console.error(error);
      setSyncState("error");
      setMessage("Unable to sync events. Please try again.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Calendar connections</CardTitle>
          <CardDescription>Connect your providers and sync events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => handleConnect("google")} variant="default">
              Connect Google
            </Button>
            <Button onClick={() => handleConnect("outlook")} variant="secondary">
              Connect Outlook
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button onClick={handleSync} disabled={syncState === "loading" || !hasAccounts}>
              {syncState === "loading" ? "Syncing..." : "Sync events"}
            </Button>
          </div>

          {message ? (
            <Alert>
              <AlertTitle>Status</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          {status === "loading" ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : null}

          {status === "error" ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load calendars</AlertTitle>
              <AlertDescription>Please refresh the page or try again later.</AlertDescription>
            </Alert>
          ) : null}

          {status === "idle" && accounts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No calendars connected yet. Connect Google or Outlook to get started.
            </div>
          ) : null}

          {status === "idle" && accounts.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Connected calendars</p>
                  <p className="text-sm text-muted-foreground">
                    Manage your linked providers and sync upcoming events.
                  </p>
                </div>
                <Badge variant="secondary">{accounts.length} connected</Badge>
              </div>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Account ID</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Connected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <Badge className={cn("capitalize")}>{account.provider}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs md:text-sm">
                          {account.providerAccountId}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {account.sourceCalendar ?? "Primary"}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {new Date(account.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
