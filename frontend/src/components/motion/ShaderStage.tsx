import React from "react";
import { Player } from "@remotion/player";
import { ShaderField } from "../../../motion/ShaderField";

type ShaderStageProps = {
  tone?: "light" | "dark";
  intensity?: number;
  compositionWidth?: number;
  compositionHeight?: number;
  autoPlay?: boolean;
};

/**
 * The animated shader, behind the Remotion `<Player>`.
 *
 * Only ever loaded inside the `full` motion tier, and only through a lazy
 * import, so Remotion never reaches a visitor whose device cannot run it. Keep
 * this module free of anything but the player: it is a chunk, not a component
 * the page should import directly.
 */
export default function ShaderStage({
  tone = "light",
  intensity = 1,
  compositionWidth = 1920,
  compositionHeight = 1080,
  autoPlay = true,
}: ShaderStageProps) {
  return (
    <Player
      component={ShaderField}
      inputProps={{ intensity, tone }}
      durationInFrames={420}
      fps={30}
      compositionWidth={compositionWidth}
      compositionHeight={compositionHeight}
      autoPlay={autoPlay}
      loop
      clickToPlay={false}
      doubleClickToFullscreen={false}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
