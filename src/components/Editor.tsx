"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  onSave: () => void;
  disabled?: boolean;
};

export function Editor({ value, onChange, onSave, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCmd = e.metaKey || e.ctrlKey;
      if (isCmd && e.key === "s") {
        e.preventDefault();
        onSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSave]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      spellCheck={false}
      placeholder={disabled ? "Pick a file from the sidebar to start editing." : "Start typing markdown."}
      className="h-full w-full resize-none bg-white px-5 py-4 font-mono text-[13px] leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-60"
    />
  );
}
