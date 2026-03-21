import React from "react";
import { Composition } from "remotion";
import { ClaudeSkillsVideo } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClaudeSkillsVideo"
        component={ClaudeSkillsVideo}
        durationInFrames={450}   // 15 seconds × 30fps
        fps={30}
        width={1080}
        height={1920}            // 9:16 portrait
      />
    </>
  );
};
