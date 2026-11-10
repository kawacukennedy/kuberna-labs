import React from "react";
import { Player } from "@remotion/player";
import { ShaderField } from "../../../motion/ShaderField";

/**
 * Site-wide ambient layer. Rendered client-only via next/dynamic (SSR is not
 * possible with the Remotion player), so this file must not be imported
 * directly from a page.
 */
export default function AmbientFieldStage() {
  return (
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
  );
}
