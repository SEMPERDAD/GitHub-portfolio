"use client";

import { useState } from "react";
import type { Platform, Tone } from "@/lib/constants";

interface PlatformOption {
  id: Platform;
  label: string;
  emoji: string;
  proOnly: boolean;
}

interface ToneOption {
  id: Tone;
  label: string;
  description: string;
  proOnly: boolean;
}

interface GeneratedCaption {
  caption: string;
  hashtags?: string[];
}

interface Props {
  isPro: boolean;
  remaining: number | null;
  platforms: readonly PlatformOption[];
  tones: readonly ToneOption[];
}

export default function CaptionGeneratorClient({
  isPro,
  remaining,
  platforms,
  tones,
}: Props) {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tone, setTone] = useState<Tone>("engaging");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedCaption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canGenerate = isPro || (remaining !== null && remaining > 0);

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("Please describe what your post is about.");
      return;
    }
    if (!canGenerate) {
      setError("You've reached your daily limit. Upgrade to Pro for unlimited captions.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, tone, topic }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Generate a Caption
      </h2>

      {/* Platform selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Platform
        </label>
        <div className="flex gap-3 flex-wrap">
          {platforms.map((p) => {
            const isLocked = p.proOnly && !isPro;
            return (
              <button
                key={p.id}
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && setPlatform(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  platform === p.id && !isLocked
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : isLocked
                    ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                    : "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
                {isLocked && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full ml-1">
                    Pro
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tone
        </label>
        <div className="flex gap-3 flex-wrap">
          {tones.map((t) => {
            const isLocked = t.proOnly && !isPro;
            return (
              <button
                key={t.id}
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && setTone(t.id)}
                title={t.description}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  tone === t.id && !isLocked
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : isLocked
                    ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                    : "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                {t.label}
                {isLocked && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full ml-2">
                    Pro
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic input */}
      <div className="mb-6">
        <label
          htmlFor="topic"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          What&apos;s your post about?
        </label>
        <textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. My morning coffee routine, our new product launch, tips for staying productive..."
          rows={3}
          className="w-full px-4 py-3 text-sm text-gray-900 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !canGenerate}
        className="w-full py-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Generating...
          </span>
        ) : canGenerate ? (
          "Generate Caption"
        ) : (
          "Daily limit reached — Upgrade to Pro"
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Your Caption
            </h3>
            <button
              type="button"
              onClick={() => handleCopy(result.caption)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-800 leading-relaxed whitespace-pre-wrap border border-gray-200">
            {result.caption}
          </div>

          {result.hashtags && result.hashtags.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Suggested Hashtags
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
