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
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function AppearancePage() {
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
      <h1 className="mb-6 text-2xl font-semibold">Appearance</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Theme</CardTitle>
            <CardDescription className="mt-1 text-sm">
              Choose between light, dark, or system default.
            </CardDescription>
          </div>
          <ThemeToggle />
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
