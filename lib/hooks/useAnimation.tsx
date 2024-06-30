"use client"

import { Animation } from '@lottiefiles/lottie-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AnimationContext {
  animationData: Animation | null;
  animationJson: object | null;
  setAnimationData: (animationJson: object) => void;
}

interface AnimationProviderProps {
  children: React.ReactNode;
}

const AnimationContext = createContext<AnimationContext>({
  animationData: null,
  animationJson: null,
  setAnimationData: () => null,
});

const animationJsonToAnimation = (animationJson: object): Animation => {
  return new Animation().fromJSON(animationJson);
}

const animationToAnimationJson = (animation: Animation): object => {
  return JSON.parse(JSON.stringify(animation));
}

const getInitialAnimation = () => {
  const animationJSON = localStorage.getItem('animationJSON')
  return animationJSON ? animationJsonToAnimation(JSON.parse(animationJSON)) : null;
}

export const AnimationProvider = ({ children }: AnimationProviderProps) => {
  const [animationData, setAnimationData] = useState<Animation | null>(getInitialAnimation);

  useEffect(() => {
    if (animationData) {
      localStorage.setItem('animationJSON', JSON.stringify(animationToAnimationJson(animationData)))
    }
  }, [animationData])

  const animationJson = animationData && animationToAnimationJson(animationData);

  const handleSetAnimationData = (animationJson: object) => {
    setAnimationData(animationJsonToAnimation(animationJson));
  }

  return (
    <AnimationContext.Provider value={{
      animationJson,
      animationData,
      setAnimationData: handleSetAnimationData,
    }}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => useContext(AnimationContext);