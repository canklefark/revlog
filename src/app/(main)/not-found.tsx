import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-5xl font-bold text-muted-foreground/30">404</p>
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="text-sm text-muted-foreground">
        This page doesn&apos;t exist or was removed.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
