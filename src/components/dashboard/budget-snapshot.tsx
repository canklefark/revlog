import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BudgetSnapshotProps = {
  spent: number;
  budget: number | null;
};

const formatUSD = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );

function getBudgetColor(pct: number): string {
  if (pct > 85) return "bg-red-500";
  if (pct > 60) return "bg-yellow-500";
  return "bg-green-500";
}

export function BudgetSnapshot({ spent, budget }: BudgetSnapshotProps) {
  if (budget === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Season Budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {formatUSD(spent)}
            </span>{" "}
            spent this season.
          </p>
          <Link
            href="/settings"
            className="text-sm font-medium underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            Set a season budget
          </Link>
        </CardContent>
      </Card>
    );
  }

  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const barColor = getBudgetColor(pct);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season Budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {formatUSD(spent)}
          </span>
          {" spent of "}
          <span className="font-semibold text-foreground">
            {formatUSD(budget)}
          </span>
        </p>

        {/* Custom progress bar with dynamic color */}
        <div
          className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round(pct)}% of season budget spent`}
        >
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {Math.round(pct)}% used
          {budget - spent > 0
            ? ` · ${formatUSD(budget - spent)} remaining`
            : " · Over budget"}
        </p>
      </CardContent>
    </Card>
  );
}
