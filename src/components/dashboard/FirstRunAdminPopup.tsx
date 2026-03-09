"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FirstRunAdminPopup = () => {
  return (
    <DismissiblePopup />
  );
};

const DismissiblePopup = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-cyan-200 bg-white p-6 shadow-xl">
        <Button
          aria-label="Dismiss setup popup"
          className="absolute right-3 top-3"
          onClick={() => setDismissed(true)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>

        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Setup Required</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Create Your Admin Account</h2>
        <p className="mt-2 text-sm text-slate-600">
          No users exist yet. Open the Payload admin portal and create the first account. It will be automatically
          assigned the <span className="font-semibold text-slate-800">admin</span> role.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <Button render={<Link href="/admin" />} nativeButton={false}>
            Open admin
          </Button>
          <Button onClick={() => setDismissed(true)} type="button" variant="outline">
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};
