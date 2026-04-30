"use client";

import { useEffect, useState } from "react";

type Props = {
  initial: string;
  onSet: (path: string) => void;
};

export function RootPicker({ initial, onSet }: Props) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSet(value.trim());
      }}
      className="flex items-center gap-2"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="/Users/you/Desktop"
        spellCheck={false}
        className="w-72 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-emerald-500"
      />
      <button
        type="submit"
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
      >
        Open
      </button>
    </form>
  );
}
