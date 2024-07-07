"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Animation } from "@lottie-animation-community/lottie-types";
import { RgbaColor, updateShapeColor } from "../animation";

interface AnimationContext {
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
  animationJson: null,
  setAnimationJson: () => null,
  selectedShapePath: null,
  setSelectedShapePath: () => null,
  updateSelectedShapeColor: () => null,
});

const getInitialAnimationJson = () => {
  const animationJson = localStorage.getItem("animationJson");
  return animationJson ? JSON.parse(animationJson) : null;
};

export const AnimationProvider = ({ children }: AnimationProviderProps) => {
  const [animationJson, setAnimationJson] = useState<Animation | null>(
    getInitialAnimationJson,
  );
  const [selectedShapePath, setSelectedShapePath] = useState<string>("");

  useEffect(() => {
    if (animationJson) {
      localStorage.setItem("animationJson", JSON.stringify(animationJson));
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
