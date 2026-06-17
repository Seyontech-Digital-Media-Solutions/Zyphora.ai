import { Layers } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Layers className="h-8 w-8 text-accent" />
        <span className="text-2xl font-bold">Zyphora</span>
      </Link>
      {children}
    </div>
  );
}
