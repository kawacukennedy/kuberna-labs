import React from "react";
import dynamic from "next/dynamic";

const HeroFieldStage = dynamic(() => import("./HeroFieldStage"), { ssr: false });

/** Client-only wrapper for the Remotion homepage hero. */
export const HeroField: React.FC = () => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <HeroFieldStage />
    </div>
  );
};
