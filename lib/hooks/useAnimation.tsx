"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AnimationRoot,
  animationJsonToTree,
  animationTreeToJson,
} from "@/lib/animationTree";

interface AnimationContext {
  animationTree: AnimationRoot | null;
  animationJson: string | null;
  setAnimationTree: (animationJson: string) => void;
}

interface AnimationProviderProps {
  children: React.ReactNode;
}

const AnimationContext = createContext<AnimationContext>({
  animationTree: null,
  animationJson: null,
  setAnimationTree: () => null,
});

const getInitialAnimation = () => {
  const animationJson = localStorage.getItem("animationJson");
  return animationJson ? animationJsonToTree(animationJson) : null;
};

export const AnimationProvider = ({ children }: AnimationProviderProps) => {
  const [animationTree, setAnimationTree] = useState<AnimationRoot | null>(
    getInitialAnimation,
  );

  useEffect(() => {
    if (animationTree) {
      const animationJson = animationTreeToJson(animationTree);
      localStorage.setItem("animationJson", animationJson);
    }
  }, [animationTree]);

  const handleSetAnimationTree = (animationJson: string) => {
    setAnimationTree(animationJsonToTree(animationJson));
  };

  return (
    <AnimationContext.Provider
      value={{
        animationTree,
        animationJson: animationTree && animationTreeToJson(animationTree),
        setAnimationTree: handleSetAnimationTree,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => useContext(AnimationContext);
