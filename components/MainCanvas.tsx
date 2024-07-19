"use client";

import dynamic from "next/dynamic";
import { FileUpload } from "./ui/FileUpload";
import { useAnimation } from "@/lib/hooks/useAnimation";
import { Loading } from "./ui/Loading";

const LottiePlayer = dynamic(
  () => import("./LottiePlayer").then((module) => module.LottiePlayer),
  { ssr: false },
);

const EXAMPLE_ANIMATION_URL = "/example-animation.json";

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

  const handleTryAnimationClick = async () => {
    const animationJson = await fetch(EXAMPLE_ANIMATION_URL).then((res) =>
      res.json(),
    );
    setAnimationJson(animationJson);
  };

  return (
    <div className="flex-1 p-4">
      <div className="flex h-full flex-col">
        <div className="mt-4 flex-1">
          <div className="flex h-full items-center justify-center flex-col">
            <Loading isLoading={isAnimationLoading} className="w-full h-full">
              {animationJson ? (
                <LottiePlayer src={animationJson} />
              ) : (
                <>
                  <FileUpload onUpload={handleUpload} />
                  <button
                    className="mt-4 text-sm text-muted-foreground hover:underline"
                    onClick={handleTryAnimationClick}
                  >
                    or try an example animation
                  </button>
                </>
              )}
            </Loading>
          </div>
        </div>
      </div>
    </div>
  );
};
