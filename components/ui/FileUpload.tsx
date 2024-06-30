"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Upload as UploadIcon } from "lucide-react";

interface FileUploadProps {
  onUpload: (file?: File) => void;
}

export const FileUpload = ({ onUpload }: FileUploadProps) => {
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFileOnDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onUpload(e?.dataTransfer?.files[0]);
  };

  const handleFileOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUpload(e?.target?.files?.[0]);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileOnDrop}
      className="border-2 border-dashed border-muted-foreground rounded-md p-8 flex flex-col items-center justify-center gap-4 cursor-pointer"
    >
      <UploadIcon className="w-8 h-8 text-muted-foreground" />
      <p className="text-muted-foreground">Drag and drop a file here</p>
      <Button
        variant="outline"
        type="button"
        onClick={() => fileInput?.current?.click()}
      >
        Select file
      </Button>
      <input ref={fileInput} type="file" hidden onChange={handleFileOnChange} />
    </div>
  );
};
