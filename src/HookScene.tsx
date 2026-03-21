import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";

// Viral hook: 0–5s (0–149 frames at 30fps)
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Wait." slides in fast at frame 0
  const waitScale = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const waitOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  // Emoji bounces in at frame 12
  const emojiScale = spring({
    frame: frame - 12,
    fps,
    config: { damping: 10, stiffness: 300 },
  });

  // "FREE AI coding skills" fades+slides in at frame 22
  const taglineY = interpolate(frame, [22, 42], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const taglineOpacity = interpolate(frame, [22, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "on GitHub" appears at frame 48
  const subOpacity = interpolate(frame, [48, 64], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [48, 64], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Pulsing glow effect
  const glowIntensity = interpolate(
    Math.sin(frame * 0.18),
    [-1, 1],
    [20, 55]
  );

  // Background particle dots
  const particles = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + frame * 0.015;
    const radius = 360 + Math.sin(frame * 0.05 + i) * 40;
    return {
      x: 540 + Math.cos(angle) * radius,
      y: 960 + Math.sin(angle) * radius,
      opacity: interpolate(Math.sin(frame * 0.08 + i * 0.7), [-1, 1], [0.15, 0.55]),
      size: 6 + Math.sin(frame * 0.1 + i) * 3,
    };
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg, #0a0a1a 0%, #0d1b3e 50%, #0a0a1a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Animated grid lines */}
      <svg
        style={{ position: "absolute", inset: 0, opacity: 0.07 }}
        width="1080"
        height="1920"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={i * 90}
            y1={0}
            x2={i * 90}
            y2={1920}
            stroke="#4488ff"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 22 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * 90}
            x2={1080}
            y2={i * 90}
            stroke="#4488ff"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Orbiting particles */}
      <svg style={{ position: "absolute", inset: 0 }} width="1080" height="1920">
        {particles.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill="#58a6ff"
            opacity={p.opacity}
          />
        ))}
      </svg>

      {/* Central glow */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(88,166,255,0.18) 0%, transparent 70%)`,
          filter: `blur(${glowIntensity}px)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* "Wait." */}
      <div
        style={{
          fontSize: 130,
          fontWeight: 900,
          color: "#ffffff",
          transform: `scale(${waitScale})`,
          opacity: waitOpacity,
          letterSpacing: -4,
          textShadow: "0 0 60px rgba(88,166,255,0.9)",
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          marginBottom: 10,
        }}
      >
        Wait.
      </div>

      {/* Shock emoji */}
      <div
        style={{
          fontSize: 120,
          transform: `scale(${emojiScale})`,
          lineHeight: 1,
          marginBottom: 32,
          filter: "drop-shadow(0 0 30px rgba(255,200,0,0.8))",
        }}
      >
        🤯
      </div>

      {/* "FREE AI coding skills" */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          textAlign: "center",
          padding: "0 60px",
          marginBottom: 20,
        }}
      >
        <span
          style={{
            fontSize: 88,
            fontWeight: 900,
            background: "linear-gradient(90deg, #58a6ff, #a78bfa, #f472b6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "'Arial Black', sans-serif",
            lineHeight: 1.05,
            display: "block",
            textShadow: "none",
          }}
        >
          FREE AI
        </span>
        <span
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#ffffff",
            fontFamily: "'Arial Black', sans-serif",
            lineHeight: 1.05,
            display: "block",
          }}
        >
          coding skills
        </span>
      </div>

      {/* "on GitHub" */}
      <div
        style={{
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          fontSize: 54,
          fontWeight: 700,
          color: "rgba(255,255,255,0.75)",
          letterSpacing: 2,
          fontFamily: "Arial, sans-serif",
          textTransform: "uppercase",
        }}
      >
        on GitHub ↓
      </div>
    </div>
  );
};
