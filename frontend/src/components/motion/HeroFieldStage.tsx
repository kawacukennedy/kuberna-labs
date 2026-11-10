import React from "react";
import { Player } from "@remotion/player";
import { Hero3D } from "../../../motion/Hero3D";
import { ShaderField } from "../../../motion/ShaderField";

/**
 * Homepage hero motion: the aurora field full-bleed, with the 3D agentic core
 * anchored to the right on large screens. Both are Remotion compositions, so
 * what ships on the site is exactly what is editable in Remotion Studio.
 */
export default function HeroFieldStage() {
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
          autoPlay
          loop
          clickToPlay={false}
          doubleClickToFullscreen={false}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div className="motion-hero-stage absolute inset-y-0 right-0 hidden w-[54%] items-center justify-center lg:flex">
        <div className="aspect-square w-full max-w-[620px]">
          <Player
            component={Hero3D}
            inputProps={{ spin: 1 }}
            durationInFrames={240}
            fps={30}
            compositionWidth={1200}
            compositionHeight={1200}
            autoPlay
            loop
            clickToPlay={false}
            doubleClickToFullscreen={false}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
