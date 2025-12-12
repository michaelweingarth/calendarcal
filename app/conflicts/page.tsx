"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";

type Conflict = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  sourceCalendar?: string | null;
  calendar?: {
    provider: string;
    sourceCalendar?: string | null;
  } | null;
};

type ConflictsResponse = {
  conflicts: Conflict[];
};

type FetchState = "idle" | "loading" | "error";

export default function ConflictsPage() {
  const router = useRouter();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [status, setStatus] = useState<FetchState>("loading");

  useEffect(() => {
    async function loadConflicts() {
      try {
        setStatus("loading");
        const response = await fetch("/api/conflicts", { cache: "no-store" });
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Unable to load conflicts");
        }
        const payload = (await response.json()) as ConflictsResponse;
        setConflicts(payload.conflicts ?? []);
        setStatus("idle");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    }

    loadConflicts();
  }, [router]);

  const hasConflicts = useMemo(() => conflicts.length > 0, [conflicts]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle>Conflicts</CardTitle>
          <CardDescription>Review overlapping events across your calendars.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "loading" ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="h-4 w-1/4 rounded bg-muted" />
              <div className="h-4 w-1/3 rounded bg-muted" />
            </div>
          ) : null}

          {status === "error" ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load conflicts</AlertTitle>
              <AlertDescription>Please refresh the page or try again later.</AlertDescription>
            </Alert>
          ) : null}

          {status === "idle" && !hasConflicts ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No conflicts detected. Sync your events to see overlaps.
            </div>
          ) : null}

          {hasConflicts ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Detected conflicts</p>
                  <p className="text-sm text-muted-foreground">
                    Events that overlap in time across your connected calendars.
                  </p>
                </div>
                <Badge variant="secondary">{conflicts.length} events</Badge>
              </div>
              <Separator />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Calendar</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.map((conflict) => (
                    <TableRow key={conflict.id} className="align-top">
                      <TableCell className="space-y-1">
                        <div className="font-medium">{conflict.title}</div>
                        <p className="text-xs text-muted-foreground">{conflict.sourceCalendar ?? "Primary"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("capitalize")}>{conflict.calendar?.provider ?? "unknown"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(conflict.startTime).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(conflict.endTime).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption className="text-xs">
                  Conflicts are determined when events overlap in time across any connected calendar.
                </TableCaption>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
