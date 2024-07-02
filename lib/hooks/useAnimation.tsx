"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Animation } from "@lottie-animation-community/lottie-types";

interface AnimationContext {
  animationJson: Animation | null;
  setAnimationJson: (animationJson: Animation) => void;
}

interface AnimationProviderProps {
  children: React.ReactNode;
}

const AnimationContext = createContext<AnimationContext>({
  animationJson: null,
  setAnimationJson: () => null,
});

const getInitialAnimationJson = () => {
  const animationJson = localStorage.getItem("animationJson");
  return animationJson ? JSON.parse(animationJson) : null;
};

export const AnimationProvider = ({ children }: AnimationProviderProps) => {
  const [animationJson, setAnimationJson] = useState<Animation | null>(
    getInitialAnimationJson,
  );

  useEffect(() => {
    if (animationJson) {
      localStorage.setItem("animationJson", JSON.stringify(animationJson));
    }
  }, [animationJson]);

  const handleSetAnimationJson = (animationJson: Animation) => {
    setAnimationJson(animationJson);
  };

  return (
    <AnimationContext.Provider
      value={{
        animationJson,
        setAnimationJson: handleSetAnimationJson,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => useContext(AnimationContext);
