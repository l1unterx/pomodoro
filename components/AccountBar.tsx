"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { clearAllDataAction, exportSessionsAction, importSessionsAction } from "@/lib/actions/data";
import LightModePrank from "@/components/LightModePrank";

function downloadBase64(filename: string, base64: string): void {
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AccountBar({ username }: { username: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleExport = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { filename, base64 } = await exportSessionsAction();
      downloadBase64(filename, base64);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      "This permanently deletes all of your session history and any active timer. This cannot be undone. Continue?",
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage(null);
    try {
      await clearAllDataAction();
      setMessage("All data cleared.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to clear data.");
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await importSessionsAction(formData);
      setMessage(`Imported ${result.imported}, skipped ${result.skipped}.`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 px-4 pt-4 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LightModePrank />

        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">{username}</span>
          <button onClick={() => void handleExport()} disabled={busy} className="underline hover:no-underline disabled:opacity-40">
            Export
          </button>
          <button onClick={handleImportClick} disabled={busy} className="underline hover:no-underline disabled:opacity-40">
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={(e) => void handleFileChange(e)}
            className="hidden"
          />
          <button onClick={() => void handleClearAll()} disabled={busy} className="underline hover:no-underline disabled:opacity-40">
            Clear
          </button>
          <form action={logoutAction}>
            <button type="submit" className="underline hover:no-underline">
              Logout
            </button>
          </form>
        </div>
      </div>
      {message && <p className="text-right text-xs text-muted">{message}</p>}
    </div>
  );
}
