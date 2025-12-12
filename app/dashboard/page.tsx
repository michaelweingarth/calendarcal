"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type UserResponse = {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
  } | null;
};

export default function DashboardPage() {
  const [data, setData] = useState<UserResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load user");
        }
        const payload = (await response.json()) as UserResponse;
        setData(payload);
        setStatus("ready");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    }

    loadUser();
  }, []);

  const user = data?.user;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Your account overview.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "loading" ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ) : null}

          {status === "error" ? (
            <Alert variant="destructive">
              <AlertTitle>Not authenticated</AlertTitle>
              <AlertDescription>
                You need to be logged in to view your dashboard. Please request a magic link to continue.
              </AlertDescription>
              <div className="mt-4 flex gap-3">
                <Button onClick={() => router.push("/login")}>Back to login</Button>
              </div>
            </Alert>
          ) : null}

          {status === "ready" && user ? (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="text-lg font-semibold">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <span>Verified: {user.emailVerified ? "Yes" : "No"}</span>
                <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                <span>User ID: {user.id}</span>
              </div>
            </div>
          ) : null}

          {status === "ready" && !user ? (
            <Alert variant="destructive">
              <AlertTitle>No session found</AlertTitle>
              <AlertDescription>We could not find your session. Please log in again.</AlertDescription>
              <div className="mt-4 flex gap-3">
                <Button onClick={() => router.push("/login")}>Back to login</Button>
              </div>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
