import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";

// Content scene: 5–10s (150–299 frames)
// localFrame = frame - 150
export const ContentScene: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { fps } = useVideoConfig();

  const repos = [
    { icon: "🤖", name: "claude-code-skills", desc: "AI pair programmer prompts" },
    { icon: "⚡", name: "remotion-skill",     desc: "Video generation toolkit" },
    { icon: "🔮", name: "ai-agent-toolkit",   desc: "Multi-agent orchestration" },
  ];

  // Title drops in
  const titleY = interpolate(localFrame, [0, 20], [-80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)),
  });
  const titleOpacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scanning beam
  const beamY = interpolate(localFrame, [10, 130], [-100, 1000], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(180deg, #080c18 0%, #0d1530 60%, #080c18 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Subtle grid */}
      <svg style={{ position: "absolute", inset: 0, opacity: 0.05 }} width="1080" height="1920">
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`v${i}`} x1={i * 90} y1={0} x2={i * 90} y2={1920} stroke="#58a6ff" strokeWidth="1" />
        ))}
        {Array.from({ length: 22 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 90} x2={1080} y2={i * 90} stroke="#58a6ff" strokeWidth="1" />
        ))}
      </svg>

      {/* Scanning beam overlay */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: beamY,
          height: 200,
          background: "linear-gradient(180deg, transparent, rgba(88,166,255,0.06), transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          marginBottom: 50,
          padding: "0 60px",
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: "#58a6ff",
            fontFamily: "'Arial Black', sans-serif",
            textTransform: "uppercase",
            letterSpacing: 4,
            marginBottom: 8,
          }}
        >
          Free GitHub Repos
        </div>
        <div
          style={{
            fontSize: 38,
            fontWeight: 700,
            color: "rgba(255,255,255,0.7)",
            fontFamily: "Arial, sans-serif",
          }}
        >
          packed with Claude Code skills
        </div>
      </div>

      {/* Repo cards */}
      {repos.map((repo, i) => {
        const cardDelay = 20 + i * 22;
        const cardSpring = spring({
          frame: localFrame - cardDelay,
          fps,
          config: { damping: 16, stiffness: 180 },
        });
        const cardOpacity = interpolate(localFrame - cardDelay, [0, 15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const cardX = interpolate(localFrame - cardDelay, [0, 1], [-120, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Shimmer on each card
        const shimmer = interpolate(
          Math.sin(localFrame * 0.12 + i * 1.2),
          [-1, 1],
          [0, 1]
        );

        return (
          <div
            key={i}
            style={{
              opacity: cardOpacity,
              transform: `translateX(${cardX * (1 - cardSpring)}px) scale(${0.85 + cardSpring * 0.15})`,
              width: 880,
              marginBottom: 28,
              borderRadius: 24,
              padding: "28px 36px",
              background: `linear-gradient(135deg, rgba(88,166,255,0.10), rgba(167,139,250,0.08))`,
              border: `1.5px solid rgba(88,166,255,${0.2 + shimmer * 0.25})`,
              boxShadow: `0 0 ${20 + shimmer * 30}px rgba(88,166,255,0.12)`,
              display: "flex",
              alignItems: "center",
              gap: 28,
            }}
          >
            {/* Icon bubble */}
            <div
              style={{
                fontSize: 58,
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: "rgba(88,166,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "1.5px solid rgba(88,166,255,0.3)",
              }}
            >
              {repo.icon}
            </div>

            <div style={{ flex: 1 }}>
              {/* Repo name with GitHub dot prefix */}
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 800,
                  color: "#ffffff",
                  fontFamily: "monospace",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ color: "#58a6ff", fontSize: 28 }}>●</span>
                {repo.name}
              </div>
              <div
                style={{
                  fontSize: 28,
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {repo.desc}
              </div>
            </div>

            {/* Star badge */}
            <div
              style={{
                fontSize: 28,
                color: "#f0c040",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 700,
                fontFamily: "Arial, sans-serif",
                flexShrink: 0,
              }}
            >
              ★ Free
            </div>
          </div>
        );
      })}
    </div>
  );
};
