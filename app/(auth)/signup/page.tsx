import Link from "next/link";
import { signUp, signInWithGoogle } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SignupPageProps = {
  searchParams?: {
    error?: string | string[];
  };
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  const rawError = searchParams?.error;
  const errorMessage = Array.isArray(rawError) ? rawError[0] : rawError;

  return (
    <Card className="w-full max-w-md bg-surface border-border">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start your free Zyphora trial</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <form action={signUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          <Button type="submit" className="w-full bg-accent hover:bg-accent-light">
            Create account
          </Button>
        </form>
        <form action={signInWithGoogle} className="w-full">
          <Button type="submit" variant="outline" className="w-full">
            Google
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
