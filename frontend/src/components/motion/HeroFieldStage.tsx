import React, { useEffect, useState } from "react";
import { AgentCore3D } from "./AgentCore3D";
import ShaderStage from "./ShaderStage";

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
};

/**
 * Homepage hero motion: the aurora field full-bleed, with the 3D agentic core
 * anchored to the right on large screens.
 *
 * This module is the expensive one — the Remotion player and three.js — so the
 * page never imports it directly. `HeroField` pulls it in only for the `full`
 * motion tier and only as a lazy chunk, with the CSS rendition already painted
 * beneath it.
 */
type HeroFieldStageProps = {
  onCoreLive?: (live: boolean) => void;
};

export default function HeroFieldStage({ onCoreLive }: HeroFieldStageProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <ShaderStage tone="light" autoPlay={!reducedMotion} />
      </div>

      <div className="motion-hero-core absolute inset-y-0 right-0 hidden w-[54%] items-center justify-center lg:flex">
        <div className="aspect-square w-full max-w-[620px]">
          <AgentCore3D onLiveChange={onCoreLive} />
        </div>
      </div>
    </div>
  );
}
