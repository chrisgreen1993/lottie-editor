import { relottie, Options } from "@lottiefiles/relottie";
import { Root } from "@lottiefiles/last";

export type AnimationRoot = Root;

const options: Options = {
  parse: {
    position: false,
  },
};

const processor = relottie().data("settings", options);

export const animationJsonToTree = (animationJson: string): AnimationRoot => {
  return processor.parse(animationJson);
};

export const animationTreeToJson = (animationTree: AnimationRoot): string => {
  return processor.stringify(animationTree);
};
