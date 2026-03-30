"use client";

import { useState } from "react";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  section: string;
  carId?: string;
  label?: string;
}

export function ExportButton({
  section,
  carId,
  label = "Export CSV",
}: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleExport() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (carId) params.set("carId", carId);
      const url = `/api/export/${section}${params.size > 0 ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        toast.error("Export failed");
        return;
      }
      const blob = await res.blob();
      const filename =
        res.headers
          .get("content-disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ?? `${section}.csv`;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Export failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isLoading}
    >
      <DownloadIcon className="size-4" />
      {isLoading ? "Exporting..." : label}
    </Button>
  );
}
