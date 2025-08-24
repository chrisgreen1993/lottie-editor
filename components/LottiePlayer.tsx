"use client";

import { useEffect, useRef, useState } from "react";
import {
  Player,
  Controls,
  IPlayerProps,
  PlayerEvent,
} from "@lottiefiles/react-lottie-player";
import { AnimationItem } from "lottie-web";
import { useAnimation } from "@/lib/hooks/useAnimation";

interface LottiePlayerProps {
  src: IPlayerProps["src"];
}

export const LottiePlayer = ({ src }: LottiePlayerProps) => {
  const playerRef = useRef<Player>(null);
  const [lottie, setLottie] = useState<AnimationItem>();
  const { isPlaying, setIsPlaying } = useAnimation();
  const hasAutoplayedRef = useRef<boolean>(false);

  const handleEvent = (event: PlayerEvent) => {
    // When the animation is updated we want to keep the animation
    // at the current frame, rather than it resetting to the start.
    if (lottie && event === PlayerEvent.InstanceSaved) {
      playerRef.current?.setSeeker(lottie?.currentFrame);
    }
    // Sync play state when user presses controls
    if (event === PlayerEvent.Play) setIsPlaying(true);
    if (event === PlayerEvent.Pause || event === PlayerEvent.Stop) setIsPlaying(false);
  };

  // Autoplay whenever a new animation is loaded
  useEffect(() => {
    // Autoplay only the first time an animation is loaded this session
    if (!src || hasAutoplayedRef.current) return;
    const id = setTimeout(() => {
      playerRef.current?.play();
      setIsPlaying(true);
      hasAutoplayedRef.current = true;
    }, 0);
    return () => clearTimeout(id);
  }, [src, setIsPlaying]);

  // Respond to global play/pause state
  useEffect(() => {
    if (isPlaying) playerRef.current?.play();
    else playerRef.current?.pause();
  }, [isPlaying]);

  return (
    <Player
      ref={playerRef}
      lottieRef={setLottie}
      onEvent={handleEvent}
      src={src}
      loop
      className="h-[80vh]"
    >
      <Controls visible buttons={["play", "stop", "repeat", "frame"]} />
    </Player>
  );
};
