"use client";
import { useEffect } from "react";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { if (!message) return; const timer = window.setTimeout(onClose, 4000); return () => window.clearTimeout(timer); }, [message, onClose]);
  if (!message) return null;
  return <div role="status" className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-card bg-foreground px-5 py-3 text-background shadow-lg"><span aria-hidden="true">✓</span><span>{message}</span><button type="button" aria-label="알림 닫기" onClick={onClose}>×</button></div>;
}
