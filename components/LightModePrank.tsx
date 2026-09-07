"use client";

import { useEffect, useRef, useState } from "react";

// A joke button. It does not switch themes - it never will. Clicking it just
// cycles through excuses in a speech bubble, in the spirit of ponytail.dev's
// "☀ light mode" button.
const LINES = [
  "Light mode? We don't do that here.",
  "This button is decorative. Like hope.",
  "Your eyes will adjust. Ours didn't.",
  "Feature request logged. The backlog is a black hole too.",
  "There is no light switch. There is only the void.",
  "Bold of you to assume this does anything.",
  "Dark mode was a design decision. This button was a joke.",
  "404: brightness not found.",
  "We tried light mode once. We do not talk about it.",
  "Still dark. Still here.",
  "Consider this button a patience stress test.",
  "The sun sets on every click.",
];

const BUBBLE_DURATION_MS = 4200;

export default function LightModePrank() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const place = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right });
  };

  useEffect(() => {
    if (message === null) return;
    window.addEventListener("scroll", place, { passive: true });
    return () => window.removeEventListener("scroll", place);
  }, [message]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = () => {
    place();
    setMessage(LINES[indexRef.current % LINES.length]);
    indexRef.current++;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMessage(null), BUBBLE_DURATION_MS);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        className="rounded-full bg-surface px-3 py-1 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        ☀ light mode
      </button>
      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{ position: "fixed", top: pos.top, right: pos.right }}
          className="z-20 max-w-60 rounded-xl bg-foreground px-3 py-2 text-sm text-background shadow-lg"
        >
          {message}
        </div>
      )}
    </>
  );
}
