"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from "lucide-react";

type StreamType = "hls" | "direct" | "embed";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onProgress?: (seconds: number) => void;
  startAt?: number;
  /**
   * Server-determined playback kind. Our secure `/api/stream/*` URLs have no
   * file extension to sniff, so the server tells the player how to treat them
   * instead of the client guessing from the URL.
   */
  type?: StreamType;
}

function isDirectVideo(src: string) {
  try {
    const url = new URL(src);
    const path = url.pathname.toLowerCase();
    return path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".ogg") ||
      path.includes(".m3u8") || path.includes("/m3u8");
  } catch {
    return false;
  }
}

function NativeVideoPlayer({ src, poster, title, onProgress, startAt = 0, type }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // HLS / mp4 loading
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const isHLS = type ? type === "hls" : (src.includes(".m3u8") || src.includes("/m3u8"));

    if (isHLS) {
      import("hls.js").then((mod) => {
        const Hls = mod.default;
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (startAt > 0) video.currentTime = startAt;
          });
          return () => hls.destroy();
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          if (startAt > 0) video.currentTime = startAt;
        }
      });
    } else {
      video.src = src;
      if (startAt > 0) {
        video.addEventListener("loadedmetadata", () => {
          video.currentTime = startAt;
        }, { once: true });
      }
    }
  }, [src, startAt, type]);

  // Progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let lastReport = 0;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
      // Report every 10 seconds
      if (onProgress && Math.floor(video.currentTime) - lastReport >= 10) {
        lastReport = Math.floor(video.currentTime);
        onProgress(Math.floor(video.currentTime));
      }
    };
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [onProgress]);

  const resetHide = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
    resetHide();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const v = videoRef.current;
    if (!bar || !v) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  const skip = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group"
      onMouseMove={resetHide}
      onMouseEnter={() => setShowControls(true)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        preload="metadata"
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

        {/* Title */}
        {title && (
          <div className="absolute top-4 left-4 text-white text-sm font-medium drop-shadow">
            {title}
          </div>
        )}

        <div className="relative px-4 pb-4 space-y-2">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="w-full h-1 bg-white/20 rounded-full cursor-pointer group/bar hover:h-2 transition-all"
            onClick={seek}
          >
            <div
              className="h-full bg-white/30 rounded-full absolute"
              style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }}
            />
            <div
              className="h-full bg-sarrows-red rounded-full relative"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition" />
            </div>
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="text-white hover:text-sarrows-red transition">
                {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
              <button onClick={() => skip(-10)} aria-label="Skip back 10 seconds" className="text-white/70 hover:text-white transition">
                <SkipBack className="w-4 h-4" />
              </button>
              <button onClick={() => skip(10)} aria-label="Skip forward 10 seconds" className="text-white/70 hover:text-white transition">
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const v = videoRef.current;
                  if (v) { v.muted = !muted; setMuted(!muted); }
                }}
                aria-label={muted ? "Unmute" : "Mute"}
                className="text-white/70 hover:text-white transition"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = videoRef.current;
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (v) v.volume = val;
                }}
                className="w-16 accent-sarrows-red"
              />
              <span className="text-white/70 text-xs tabular-nums">
                {fmt(currentTime)} / {fmt(duration)}
              </span>
            </div>
            <button onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} className="text-white/70 hover:text-white transition">
              {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Center play button on pause */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 border-2 border-white/30 flex items-center justify-center">
            <Play className="w-7 h-7 text-white fill-current ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}

function IframePlayer({ src, onProgress }: { src: string; onProgress?: (s: number) => void }) {
  // Call onProgress(0) once on mount so the item appears in watch history
  useEffect(() => {
    if (onProgress) onProgress(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <iframe
        src={src}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

export default function VideoPlayer({ src, poster, title, onProgress, startAt = 0, type }: VideoPlayerProps) {
  const isEmbed = type ? type === "embed" : (src && !isDirectVideo(src));
  if (src && isEmbed) {
    return <IframePlayer src={src} onProgress={onProgress} />;
  }
  return <NativeVideoPlayer src={src} poster={poster} title={title} onProgress={onProgress} startAt={startAt} type={type} />;
}
