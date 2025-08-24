"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Animation } from "@lottie-animation-community/lottie-types";
import {
  RgbaColor,
  updateDimensions,
  updateFramerate,
  updateShapeColor,
  deleteLayer,
  replaceColorGlobally,
  setLayerHidden,
  getLayerHidden,
} from "../animation";
import { createStorageValue } from "../storage";

interface AnimationContext {
  isAnimationLoading: boolean;
  animationJson: Animation | null;
  setAnimationJson: (animationJson: Animation) => void;
  removeAnimationJson: () => void;
  selectedShapePath: string | null;
  setSelectedShapePath: (path: string) => void;
  hoveredShapePaths: string[];
  setHoveredShapePaths: (paths: string[]) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  updateSelectedShapeColor: (color: RgbaColor) => void;
  updateFramerate: (framerate: number) => void;
  updateDimensions: (width: number, height: number) => void;
  deleteLayer: (layerIndex: number) => void;
  updateColorGlobally: (from: RgbaColor, to: RgbaColor) => void;
  toggleLayerHidden: (layerPath: string) => void;
}

interface AnimationProviderProps {
  children: React.ReactNode;
}

const AnimationContext = createContext<AnimationContext>({
  isAnimationLoading: true,
  animationJson: null,
  setAnimationJson: () => null,
  removeAnimationJson: () => null,
  selectedShapePath: null,
  setSelectedShapePath: () => null,
  hoveredShapePaths: [],
  setHoveredShapePaths: () => null,
  isPlaying: true,
  setIsPlaying: () => null,
  updateSelectedShapeColor: () => null,
  updateFramerate: () => null,
  updateDimensions: () => null,
  deleteLayer: () => null,
  updateColorGlobally: () => null,
  toggleLayerHidden: () => null,
});

const animationStorage = createStorageValue<Animation>("animationJson", null);

export const AnimationProvider = ({ children }: AnimationProviderProps) => {
  const [isAnimationLoading, setIsAnimationLoading] = useState(true);
  const [animationJson, setAnimationJson] = useState<Animation | null>(null);

  const [selectedShapePath, setSelectedShapePath] = useState<string>("");
  const [hoveredShapePaths, setHoveredShapePaths] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

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

  const handleRemoveAnimationJson = () => {
    animationStorage.remove();
    setAnimationJson(null);
  };

  const handleUpdateSelectedShapeColor = (color: RgbaColor) => {
    if (animationJson) {
      setAnimationJson(
        updateShapeColor(animationJson, selectedShapePath, color),
      );
    }
  };

  const handleUpdateFramerate = (framerate: number) => {
    if (animationJson) {
      setAnimationJson(updateFramerate(animationJson, framerate));
    }
  };

  const handleUpdateDimensions = (width: number, height: number) => {
    if (animationJson) {
      setAnimationJson(updateDimensions(animationJson, width, height));
    }
  };

  const handleDeleteLayer = (layerIndex: number) => {
    if (animationJson) {
      setAnimationJson(deleteLayer(animationJson, layerIndex));
    }
  };

  const handleUpdateColorGlobally = (from: RgbaColor, to: RgbaColor) => {
    if (animationJson) {
      setAnimationJson(replaceColorGlobally(animationJson, from, to));
    }
  };

  const handleToggleLayerHidden = (layerPath: string) => {
    if (!animationJson) return;
    const currentHidden = getLayerHidden(animationJson, layerPath);
    setAnimationJson(setLayerHidden(animationJson, layerPath, !currentHidden));
  };

  return (
    <AnimationContext.Provider
      value={{
        isAnimationLoading,
        animationJson,
        setAnimationJson: handleSetAnimationJson,
        removeAnimationJson: handleRemoveAnimationJson,
        hoveredShapePaths,
        setHoveredShapePaths,
        isPlaying,
        setIsPlaying,
        updateSelectedShapeColor: handleUpdateSelectedShapeColor,
        updateFramerate: handleUpdateFramerate,
        updateDimensions: handleUpdateDimensions,
        deleteLayer: handleDeleteLayer,
        updateColorGlobally: handleUpdateColorGlobally,
        toggleLayerHidden: handleToggleLayerHidden,
        selectedShapePath,
        setSelectedShapePath,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => useContext(AnimationContext);
