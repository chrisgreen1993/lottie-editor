"use client";

import dynamic from "next/dynamic";
import { FileUpload } from "./ui/FileUpload";
import { useAnimation } from "@/lib/hooks/useAnimation";
import { Loading } from "./ui/Loading";

const LottiePlayer = dynamic(
  () => import("./LottiePlayer").then((module) => module.LottiePlayer),
  { ssr: false },
);

export const MainCanvas = () => {
  const { animationJson, isAnimationLoading, setAnimationJson } =
    useAnimation();

  const handleUpload = (file?: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const animationJson = e?.target?.result as string;
        setAnimationJson(JSON.parse(animationJson));
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex-1 p-4">
      <div className="flex h-full flex-col">
        <div className="mt-4 flex-1">
          <div className="flex h-full items-center justify-center">
            <Loading isLoading={isAnimationLoading} className="w-full h-full">
              {animationJson ? (
                <LottiePlayer src={animationJson} />
              ) : (
                <FileUpload onUpload={handleUpload} />
              )}
            </Loading>
          </div>
        </div>
      </div>
    </div>
  );
};
