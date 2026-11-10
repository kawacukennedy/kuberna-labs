import React from "react";
import { Composition, Folder } from "remotion";
import { Hero3D } from "./Hero3D";
import { HeroScene } from "./HeroScene";
import { ShaderField } from "./ShaderField";
import { CANVAS } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Kuberna">
        <Composition
          id="HeroScene"
          component={HeroScene}
          durationInFrames={300}
          fps={CANVAS.fps}
          width={CANVAS.width}
          height={CANVAS.height}
          defaultProps={{
            headline: "Architect the Agentic Web3 Enterprise",
            eyebrow: "Agentic Computing Environment",
            spin: 1,
          }}
        />
        <Composition
          id="Hero3D"
          component={Hero3D}
          durationInFrames={240}
          fps={CANVAS.fps}
          width={1200}
          height={1200}
          defaultProps={{ spin: 1 }}
        />
        <Composition
          id="ShaderField"
          component={ShaderField}
          durationInFrames={360}
          fps={CANVAS.fps}
          width={CANVAS.width}
          height={CANVAS.height}
          defaultProps={{ intensity: 1, tone: "dark" }}
        />
      </Folder>
    </>
  );
};
