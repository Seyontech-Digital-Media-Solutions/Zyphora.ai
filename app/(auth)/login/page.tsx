"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn, signInWithGoogle, resendConfirmationEmail } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type LoginPageProps = {
  searchParams?: {
    error?: string | string[];
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const rawError = searchParams?.error;
  const errorMessage = Array.isArray(rawError) ? rawError[0] : rawError;
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const isEmailNotConfirmedError = errorMessage?.includes("Email not confirmed");

  const handleResendEmail = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      const result = await resendConfirmationEmail(email);
      if (result.error) {
        setResendMessage(result.error);
      } else {
        setResendMessage(result.message || "Confirmation email sent!");
      }
    } catch {
      setResendMessage("Failed to resend email");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-surface border-border">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your Zyphora account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant={isEmailNotConfirmedError ? "default" : "destructive"} className={isEmailNotConfirmedError ? "border-yellow-600 bg-yellow-50 text-yellow-900" : ""}>
            <AlertDescription className={isEmailNotConfirmedError ? "text-yellow-800" : ""}>
              {errorMessage}
              {isEmailNotConfirmedError && (
                <p className="mt-2 text-sm">Check your email for a confirmation link. Didn&apos;t receive it?</p>
              )}
            </AlertDescription>
          </Alert>
        )}
        {resendMessage && (
          <Alert variant="default" className="border-green-600 bg-green-50 text-green-900">
            <AlertDescription className="text-green-800">{resendMessage}</AlertDescription>
          </Alert>
        )}
        <form action={signIn} className="space-y-4" onSubmit={(e) => setEmail((e.currentTarget.elements.namedItem('email') as HTMLInputElement)?.value || email)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full bg-accent hover:bg-accent-light">
            Sign in
          </Button>
        </form>
        {isEmailNotConfirmedError && email && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendEmail}
            disabled={resendLoading}
          >
            {resendLoading ? "Sending..." : "Resend confirmation email"}
          </Button>
        )}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <form action={signInWithGoogle} className="w-full">
          <Button type="submit" variant="outline" className="w-full">
            Google
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
