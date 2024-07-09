"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Animation } from "@lottie-animation-community/lottie-types";
import { RgbaColor, updateShapeColor } from "../animation";
import { createStorageValue } from "../storage";

interface AnimationContext {
  isAnimationLoading: boolean;
  animationJson: Animation | null;
  setAnimationJson: (animationJson: Animation) => void;
  selectedShapePath: string | null;
  setSelectedShapePath: (path: string) => void;
  updateSelectedShapeColor: (color: RgbaColor) => void;
}

interface AnimationProviderProps {
  children: React.ReactNode;
}

const AnimationContext = createContext<AnimationContext>({
  isAnimationLoading: true,
  animationJson: null,
  setAnimationJson: () => null,
  selectedShapePath: null,
  setSelectedShapePath: () => null,
  updateSelectedShapeColor: () => null,
});

const animationStorage = createStorageValue<Animation>("animationJson", null);

export const AnimationProvider = ({ children }: AnimationProviderProps) => {
  const [isAnimationLoading, setIsAnimationLoading] = useState(true);
  const [animationJson, setAnimationJson] = useState<Animation | null>(null);

  const [selectedShapePath, setSelectedShapePath] = useState<string>("");

  useEffect(() => {
    if (animationJson) {
      animationStorage.set(animationJson);
    } else {
      setAnimationJson(animationStorage.get());
      setIsAnimationLoading(false);
    }
  }, [animationJson]);

  const handleSetAnimationJson = (animationJson: Animation) => {
    setAnimationJson(animationJson);
  };

  const handleUpdateSelectedShapeColor = (color: RgbaColor) => {
    if (animationJson) {
      setAnimationJson(
        updateShapeColor(animationJson, selectedShapePath, color),
      );
    }
  };

  return (
    <AnimationContext.Provider
      value={{
        isAnimationLoading,
        animationJson,
        setAnimationJson: handleSetAnimationJson,
        updateSelectedShapeColor: handleUpdateSelectedShapeColor,
        selectedShapePath,
        setSelectedShapePath,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => useContext(AnimationContext);
