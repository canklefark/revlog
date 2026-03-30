"use client";

import { useState } from "react";
import { ArchiveIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ExportAllButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleExport() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/export/bundle");
      if (!res.ok) {
        toast.error("Export failed");
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "revlog-export.zip";
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Export failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isLoading}>
      <ArchiveIcon className="size-4" />
      {isLoading ? "Exporting..." : "Export All Data"}
    </Button>
  );
}
