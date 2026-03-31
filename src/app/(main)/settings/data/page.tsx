import { requireAuth } from "@/lib/auth-utils";
import { ExportAllButton } from "@/components/shared/export-all-button";

export default async function DataManagementPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Data Management</h1>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Data Export</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Download all your RevLog data as a ZIP archive containing CSV files
            for events, mods, wishlist, maintenance, and run times. All data is
            scoped to your account only.
          </p>
        </div>
        <ExportAllButton />
      </section>
    </div>
  );
}
