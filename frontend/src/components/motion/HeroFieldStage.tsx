import React, { useEffect, useState } from "react";
import { Player } from "@remotion/player";
import { ShaderField } from "../../../motion/ShaderField";
import { AgentCore3D } from "./AgentCore3D";

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
 * anchored to the right on large screens. The field is a Remotion composition,
 * so what ships on the site is exactly what is editable in Remotion Studio; the
 * core is a plain three.js canvas so it paints independently of the player.
 *
 * Visitors who prefer reduced motion get the same composition paused on a
 * composed frame rather than a blank half of the hero.
 */
export default function HeroFieldStage() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <Player
          component={ShaderField}
          inputProps={{ intensity: 1, tone: "light" as const }}
          durationInFrames={420}
          fps={30}
          compositionWidth={1920}
          compositionHeight={1080}
          autoPlay={!reducedMotion}
          loop
          clickToPlay={false}
          doubleClickToFullscreen={false}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div className="motion-hero-stage absolute inset-y-0 right-0 hidden w-[54%] items-center justify-center lg:flex">
        <div className="aspect-square w-full max-w-[620px]">
          <AgentCore3D />
        </div>
      </div>
    </div>
  );
}
