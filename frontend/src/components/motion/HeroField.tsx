import React, { useEffect, useState } from "react";
import HeroFieldStage from "./HeroFieldStage";

/**
 * Homepage hero motion.
 *
 * The stage is imported statically on purpose: when it was a `next/dynamic`
 * split chunk, a stale dev build served the page with a 404 for that chunk and
 * the whole hero rendered as an empty box (the `ChunkLoadError` in the console).
 * Only the homepage imports this module, so bundling it removes a network round
 * trip and removes the failure mode.
 *
 * The stage is still client-only — the Remotion player cannot render on the
 * server — so it mounts after hydration against the same static wash, which
 * means no layout shift.
 */
export const HeroField: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div className="absolute inset-0 motion-hero-fallback" />
      {mounted ? <HeroFieldStage /> : null}
    </div>
  );
};
