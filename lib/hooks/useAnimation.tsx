"use client"

import React, { createContext, useContext, useState } from 'react';

interface AnimationContext {
  animationData: {} | null;
  setAnimationData: (animationData: any) => void;
}

interface AnimationProviderProps {
  children: React.ReactNode;
}

const AnimationContext = createContext<AnimationContext>({
  animationData: null,
  setAnimationData: () => null,
});

export const AnimationProvider = ({ children }: AnimationProviderProps) => {
  const [animationData, setAnimationData] = useState(null);

  return (
    <AnimationContext.Provider value={{
      animationData,
      setAnimationData,
    }}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => useContext(AnimationContext);