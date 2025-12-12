"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Validating your link...");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error ?? "Unable to verify token.");
        }

        setStatus("success");
        setMessage("Verified! Redirecting to your dashboard...");
        setTimeout(() => router.push("/dashboard"), 800);
      } catch (error) {
        console.error(error);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Verification failed.");
      }
    }

    verify();
  }, [router, token]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>We are validating your magic link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" ? (
            <div className="flex items-center space-x-3">
              <div
                className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: "#e5e7eb" }}
              >
                <span className="sr-only">Loading</span>
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ) : null}

          {status === "success" ? (
            <Alert className="border-green-500/60 bg-green-600/10 text-green-100">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          {status === "error" ? (
            <Alert variant="destructive">
              <AlertTitle>Verification failed</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          {status === "error" ? (
            <Button className="w-full" onClick={() => router.push("/login")}>Return to login</Button>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
