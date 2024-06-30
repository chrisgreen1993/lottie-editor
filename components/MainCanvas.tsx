"use client"

import dynamic from 'next/dynamic';
import { useState } from 'react'
import { FileUpload } from './ui/FileUpload'
import { useAnimation } from '@/lib/hooks/useAnimation';

const LottiePlayer = dynamic(() => import('./LottiePlayer').then((module) => module.LottiePlayer), { ssr: false });

export const MainCanvas = () => {
  const { animationData, setAnimationData } = useAnimation();

  const handleUpload = (file?: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const animationJson = JSON.parse(e?.target?.result as string);
        setAnimationData(animationJson);
      };
      reader.readAsText(file);
    }
  };


  return (
    <div className="flex-1 p-4">
      <div className="flex h-full flex-col">
        <div className="mt-4 flex-1 rounded-md bg-muted/40">
          <div className="flex h-full items-center justify-center">
            {animationData ? (
              <LottiePlayer src={animationData} />
            ) : (
              <FileUpload onUpload={handleUpload} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}