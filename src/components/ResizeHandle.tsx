"use client";

import { useCallback, useRef } from "react";

type Props = {
  onResize: (deltaX: number) => void;
  onCommit?: () => void;
};

export function ResizeHandle({ onResize, onCommit }: Props) {
  const lastXRef = useRef<number | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      lastXRef.current = e.clientX;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev: MouseEvent) => {
        if (lastXRef.current === null) return;
        const delta = ev.clientX - lastXRef.current;
        lastXRef.current = ev.clientX;
        if (delta !== 0) onResize(delta);
      };
      const onUp = () => {
        lastXRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        onCommit?.();
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [onResize, onCommit]
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onMouseDown={onMouseDown}
      className="group relative w-1 shrink-0 cursor-col-resize bg-zinc-200 transition-colors hover:bg-emerald-400"
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  );
}
