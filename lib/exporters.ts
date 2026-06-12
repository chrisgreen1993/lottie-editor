import { zipSync, strToU8 } from "fflate";

import { collapseSingleKeyframes } from "./lottie/keyframes";
import type { LottieDoc } from "./lottie/model";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export-ready copy: single-keyframe props collapse to constants so the
 *  file plays in every lottie player. */
function exportable(doc: LottieDoc): LottieDoc {
  return collapseSingleKeyframes(structuredClone(doc));
}

export function downloadJson(
  doc: LottieDoc,
  fileName: string,
  pretty: boolean,
): void {
  const json = JSON.stringify(exportable(doc), null, pretty ? 2 : undefined);
  downloadBlob(
    new Blob([json], { type: "application/json" }),
    `${fileName}.json`,
  );
}

export async function copyJson(doc: LottieDoc): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(exportable(doc)));
}

/** Package the animation as a .lottie (dotLottie) archive. */
export function downloadDotLottie(doc: LottieDoc, fileName: string): void {
  const manifest = {
    version: "1.0",
    generator: "lottie-editor",
    animations: [{ id: "animation", speed: 1, loop: true }],
  };
  const zipped = zipSync({
    "manifest.json": strToU8(JSON.stringify(manifest)),
    "animations/animation.json": strToU8(JSON.stringify(exportable(doc))),
  });
  const bytes = new Uint8Array(zipped);
  downloadBlob(
    new Blob([bytes.buffer as ArrayBuffer], { type: "application/zip" }),
    `${fileName}.lottie`,
  );
}
