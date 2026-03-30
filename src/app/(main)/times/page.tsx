import { requireAuth } from "@/lib/auth-utils";
import { Timer } from "lucide-react";

export default async function TimesPage() {
  await requireAuth();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Timer className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Times Tracker</h1>
      <p className="max-w-sm text-muted-foreground">
        Run and lap time tracking is coming soon. You&apos;ll be able to log
        your runs, compare times across events, and analyze your performance.
      </p>
    </div>
  );
}
