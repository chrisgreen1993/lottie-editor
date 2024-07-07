import { useRef, useState } from "react";
import {
  Player,
  Controls,
  IPlayerProps,
  PlayerEvent,
} from "@lottiefiles/react-lottie-player";
import { AnimationItem } from "lottie-web";

interface LottiePlayerProps {
  src: IPlayerProps["src"];
}

export const LottiePlayer = ({ src }: LottiePlayerProps) => {
  const playerRef = useRef<Player>(null);
  const [lottie, setLottie] = useState<AnimationItem>();

  const handleEvent = (event: PlayerEvent) => {
    // When the animation is updated we want to keep the animation
    // at the current frame, rather than it resetting to the start.
    if (lottie && event === PlayerEvent.InstanceSaved) {
      playerRef.current?.setSeeker(lottie?.currentFrame);
    }
  };

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
