"use client";

import * as React from "react";
import { Bold, Italic, List, Heading2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight rich-text editor (contentEditable + execCommand).
 * Production would use a structured editor (e.g. TipTap/ProseMirror).
 */
export function RichEditor({
  value,
  onChange,
  resetKey,
  placeholder = "Write your observation…",
  className,
  minHeight = 180,
}: {
  value: string;
  onChange: (html: string) => void;
  resetKey: string;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = React.useState(!value);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = value || "";
      setEmpty(!ref.current.textContent?.trim());
    }
    // only when switching documents / restoring
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };
  const emit = () => {
    if (!ref.current) return;
    setEmpty(!ref.current.textContent?.trim());
    onChange(ref.current.innerHTML);
  };

  const tool = (label: string, icon: React.ReactNode, fn: () => void) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => {
        e.preventDefault();
        fn();
      }}
      className="rounded-md p-1.5 text-muted transition-colors hover:bg-canvas-2 hover:text-ink [&_svg]:size-4"
    >
      {icon}
    </button>
  );

  return (
    <div className={cn("rounded-lg border border-line bg-surface focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/15", className)}>
      <div className="flex items-center gap-0.5 border-b border-line px-1.5 py-1">
        {tool("Bold", <Bold />, () => exec("bold"))}
        {tool("Italic", <Italic />, () => exec("italic"))}
        {tool("Bulleted list", <List />, () => exec("insertUnorderedList"))}
        {tool("Heading", <Heading2 />, () => exec("formatBlock", "<h4>"))}
        <span className="mx-1 h-4 w-px bg-line" />
        {tool("Undo", <Undo2 />, () => exec("undo"))}
      </div>
      <div className="relative">
        {empty && <p className="pointer-events-none absolute left-3.5 top-3 text-[14px] text-muted/70">{placeholder}</p>}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline
          aria-label="Observation text"
          onInput={emit}
          className="prose-obs px-3.5 py-3 text-[14px] leading-relaxed text-ink outline-none [&_h4]:mb-2 [&_h4]:font-semibold"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}
