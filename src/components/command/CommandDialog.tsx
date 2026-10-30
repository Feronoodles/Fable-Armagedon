"use client";

import { useEffect, useId, useRef } from "react";
import { CommandIcon } from "./CommandIcon";
import { useI18n } from "@/components/I18nProvider";

export function CommandDialog({ title, children, onClose, wide = false, busy = false }: {
  title: string; children: React.ReactNode; onClose: () => void; wide?: boolean; busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null), titleId = useId();
  const { language } = useI18n();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previous; };
  }, []);
  return <dialog ref={ref} className={"command-dialog" + (wide ? " is-wide" : "")} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="command-dialog-inner"><header><div><p className="command-eyebrow">FABLE ARMAGEDDON</p><h2 id={titleId}>{title}</h2></div><button type="button" className="command-icon-button" onClick={onClose} disabled={busy} aria-label={language === "en" ? "Close" : "Cerrar"}><CommandIcon name="close" /></button></header>{children}</div>
  </dialog>;
}
