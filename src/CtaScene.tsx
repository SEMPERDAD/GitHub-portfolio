import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";

// CTA scene: 10–15s (300–449 frames)
// localFrame = frame - 300
export const CtaScene: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { fps } = useVideoConfig();

  // Main CTA spring entrance
  const ctaScale = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 200 },
  });
  const ctaOpacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Search GitHub" line appears at frame 20
  const searchOpacity = interpolate(localFrame, [20, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const searchY = interpolate(localFrame, [20, 38], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Keyword highlight appears at frame 42
  const kwOpacity = interpolate(localFrame, [42, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Follow button pulse
  const buttonPulse = spring({
    frame: localFrame - 55,
    fps,
    config: { damping: 8, stiffness: 260 },
  });
  const buttonScale = 0.9 + buttonPulse * 0.12;

  // Continuous subtle rotation for star ring
  const ringRotate = localFrame * 1.2;

  // Pulsing glow
  const glow = interpolate(Math.sin(localFrame * 0.15), [-1, 1], [30, 80]);

  // Confetti-style dots raining
  const dots = Array.from({ length: 20 }, (_, i) => {
    const startY = -60 - (i * 47) % 300;
    const x = (i * 113) % 1080;
    const speed = 2.5 + (i % 4) * 0.8;
    const y = startY + localFrame * speed;
    return {
      x,
      y: y % 2100 - 100,
      size: 8 + (i % 4) * 4,
      color: ["#58a6ff", "#a78bfa", "#f472b6", "#34d399"][i % 4],
      opacity: 0.25 + (i % 3) * 0.1,
    };
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(180deg, #06090f 0%, #0c1428 55%, #06090f 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Rain dots */}
      <svg style={{ position: "absolute", inset: 0 }} width="1080" height="1920">
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.size} fill={d.color} opacity={d.opacity} />
        ))}
      </svg>

      {/* Central glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(88,166,255,0.14) 0%, transparent 70%)",
          filter: `blur(${glow}px)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Rotating star ring */}
      <svg
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${ringRotate}deg)`,
          opacity: 0.15,
        }}
        width="900"
        height="900"
        viewBox="-450 -450 900 900"
      >
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <text
              key={i}
              x={Math.cos(angle) * 380}
              y={Math.sin(angle) * 380}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={38}
              fill="#58a6ff"
            >
              ★
            </text>
          );
        })}
      </svg>

      {/* Main heading */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${0.8 + ctaScale * 0.2})`,
          textAlign: "center",
          padding: "0 70px",
          marginBottom: 48,
        }}
      >
        <div
          style={{
            fontSize: 78,
            fontWeight: 900,
            color: "#ffffff",
            fontFamily: "'Arial Black', sans-serif",
            lineHeight: 1.05,
            marginBottom: 14,
            textShadow: "0 0 60px rgba(88,166,255,0.5)",
          }}
        >
          Start using AI
        </div>
        <div
          style={{
            fontSize: 78,
            fontWeight: 900,
            background: "linear-gradient(90deg, #58a6ff 0%, #a78bfa 50%, #f472b6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "'Arial Black', sans-serif",
            lineHeight: 1.05,
          }}
        >
          for FREE today
        </div>
      </div>

      {/* Search instruction card */}
      <div
        style={{
          opacity: searchOpacity,
          transform: `translateY(${searchY}px)`,
          background: "rgba(88,166,255,0.08)",
          border: "1.5px solid rgba(88,166,255,0.3)",
          borderRadius: 20,
          padding: "24px 44px",
          marginBottom: 40,
          width: 820,
        }}
      >
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.6)",
            fontFamily: "Arial, sans-serif",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          Search GitHub for:
        </div>
        <div
          style={{
            opacity: kwOpacity,
            fontSize: 48,
            fontWeight: 800,
            color: "#58a6ff",
            fontFamily: "monospace",
            textAlign: "center",
            letterSpacing: 1,
            textShadow: "0 0 30px rgba(88,166,255,0.6)",
          }}
        >
          "claude code skills"
        </div>
      </div>

      {/* Follow CTA button */}
      <div
        style={{
          transform: `scale(${buttonScale})`,
          background: "linear-gradient(135deg, #58a6ff, #a78bfa)",
          borderRadius: 60,
          padding: "26px 72px",
          fontSize: 44,
          fontWeight: 900,
          color: "#ffffff",
          fontFamily: "'Arial Black', sans-serif",
          textAlign: "center",
          boxShadow: "0 0 60px rgba(88,166,255,0.45), 0 8px 32px rgba(0,0,0,0.4)",
          letterSpacing: 1,
        }}
      >
        Follow for more 🚀
      </div>
    </div>
  );
};
