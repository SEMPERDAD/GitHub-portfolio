import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { HookScene } from "./HookScene";
import { ContentScene } from "./ContentScene";
import { CtaScene } from "./CtaScene";

// Scene boundaries (30fps, 15s = 450 frames)
//   Hook:    0  – 149  (0s – 4.97s)
//   Content: 150 – 299 (5s  – 9.97s)
//   CTA:     300 – 449 (10s – 14.97s)

const HOOK_END = 150;
const CONTENT_END = 300;

const crossfadeFrames = 12; // 0.4s overlap

function sceneFade(frame: number, start: number, end: number): number {
  const fadeIn = interpolate(frame, [start, start + crossfadeFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const fadeOut = interpolate(frame, [end - crossfadeFrames, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  return Math.min(fadeIn, fadeOut);
}

export const ClaudeSkillsVideo: React.FC = () => {
  const frame = useCurrentFrame();

  const hookOpacity    = sceneFade(frame, 0,         HOOK_END);
  const contentOpacity = sceneFade(frame, HOOK_END,   CONTENT_END);
  const ctaOpacity     = sceneFade(frame, CONTENT_END, 450);

  return (
    <div style={{ width: 1080, height: 1920, position: "relative", overflow: "hidden" }}>
      {/* Hook scene */}
      <div style={{ position: "absolute", inset: 0, opacity: hookOpacity }}>
        <HookScene />
      </div>

      {/* Content scene */}
      <div style={{ position: "absolute", inset: 0, opacity: contentOpacity }}>
        <ContentScene localFrame={Math.max(0, frame - HOOK_END)} />
      </div>

      {/* CTA scene */}
      <div style={{ position: "absolute", inset: 0, opacity: ctaOpacity }}>
        <CtaScene localFrame={Math.max(0, frame - CONTENT_END)} />
      </div>

      {/* Safe-zone debug overlay (comment out for final render) */}
      {/* <SafeZoneGuide /> */}
    </div>
  );
};
