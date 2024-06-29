"use client"

import { useState } from 'react'
import { FileUpload } from './ui/FileUpload'
import { Player, Controls } from '@lottiefiles/react-lottie-player';
import TestAnimationData from '@/lib/test_animation.json';

export const MainCanvas = () => {
  const [animationData, setAnimationData] = useState(TestAnimationData);

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
              <Player src={animationData} autoplay loop className="h-[80vh]">
                <Controls visible />
              </Player>
            ) : (
              <FileUpload onUpload={handleUpload} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}