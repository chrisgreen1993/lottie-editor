"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "./ui/Button";
import { Download, LogOut } from "lucide-react";
import { useAnimation } from "@/lib/hooks/useAnimation";

export const NavBar = () => {
  const { animationJson, removeAnimationJson, isAnimationLoading } =
    useAnimation();
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const handleDownloadClick = () => {
    if (!downloadRef?.current) return;
    // Convert the animation json into a blob url and click the hidden anchor tag
    const jsonString = JSON.stringify(animationJson);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadRef.current.href = url;
    downloadRef.current.download = "animation.json";
    downloadRef.current.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Link href="#" className="flex items-center gap-2" prefetch={false}>
          <span className="font-medium">Lottie Editor</span>
        </Link>
      </div>
      {animationJson && (
        <div className="flex items-center gap-4">
          <a ref={downloadRef} className="hidden"></a>
          <Button disabled={isAnimationLoading} onClick={handleDownloadClick}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={removeAnimationJson}>
            <LogOut className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>
      )}
    </header>
  );
};
