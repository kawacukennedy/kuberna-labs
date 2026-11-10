import React, { useEffect, useState } from "react";
import { Player } from "@remotion/player";
import { ShaderField } from "../../../motion/ShaderField";

type ShaderPanelProps = {
  tone?: "dark" | "light";
  className?: string;
  children?: React.ReactNode;
};

/**
 * A framed shader surface for content sections. Client-only (the Remotion
 * player needs the DOM), with a static gradient underneath so the frame never
 * flashes empty.
 */
export const ShaderPanel: React.FC<ShaderPanelProps> = ({ tone = "dark", className, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            tone === "dark"
              ? "radial-gradient(120% 100% at 20% 10%, #312e81 0%, #121c2a 55%, #0b1220 100%)"
              : "radial-gradient(120% 100% at 20% 10%, #e8ecff 0%, #f8f9ff 60%, #eef4ff 100%)",
        }}
      />
      {mounted ? (
        <div aria-hidden className="absolute inset-0">
          <Player
            component={ShaderField}
            inputProps={{ intensity: tone === "dark" ? 1 : 0.9, tone }}
            durationInFrames={420}
            fps={30}
            compositionWidth={1080}
            compositionHeight={1080}
            autoPlay
            loop
            clickToPlay={false}
            doubleClickToFullscreen={false}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      ) : null}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};

export default ShaderPanel;
