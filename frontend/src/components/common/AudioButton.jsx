import React, { useState, useRef, useEffect } from "react";

export default function AudioButton({ audioUrl, onPlayStateChange }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Reset audio state when URL changes (e.g. page flip)
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    }
  }, [audioUrl]);

  const toggleAudio = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        if (onPlayStateChange) onPlayStateChange(false);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          if (onPlayStateChange) onPlayStateChange(true);
        })
        .catch((err) => {
          console.warn("Audio playback interrupted:", err);
        });
    }
  };

  return (
    <div className="inline-block">
      <button
        onClick={toggleAudio}
        disabled={!audioUrl}
        className={`px-6 py-3 rounded-2xl text-xl font-bold flex items-center space-x-3 shadow-md transition ${
          !audioUrl
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : isPlaying
              ? "bg-red-500 text-white animate-pulse"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
        }`}
      >
        <span className="text-2xl">{isPlaying ? "⏸" : "🔊"}</span>
        <span>{isPlaying ? "ನಿಲ್ಲಿಸಿ (Pause)" : "ಕೇಳಿ (Listen)"}</span>
      </button>
    </div>
  );
}
