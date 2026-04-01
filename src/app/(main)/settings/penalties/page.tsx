import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PenaltiesPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/settings"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Settings
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Penalty Defaults</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Run penalties add time to your raw lap times. The default is 2 seconds
        per cone, which is standard for autocross. You can override penalties
        per-run when logging times.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Penalty Rules</CardTitle>
          <CardDescription>
            These defaults apply when no per-run override is set.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border rounded-md border">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">Cone penalty</span>
              <span className="text-sm text-muted-foreground">
                +2 seconds each (default)
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">Off-course / DNF</span>
              <span className="text-sm text-muted-foreground">
                Marks run as DNF — no adjusted time
              </span>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Per-run overrides are set directly on the run form when logging
            times.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
