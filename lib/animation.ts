import {
  Animation,
  Layer,
  Shape,
} from "@lottie-animation-community/lottie-types";

const LayerTypes = {
  Shape: 4,
};
``;
const ShapeTypes = {
  Fill: "fl",
  Stroke: "st",
  Group: "gr",
};

export interface LayerInfo {
  path: string;
  name: string;
  shapes: ShapeInfo[];
}

export interface ShapeInfo {
  path: string;
  name: string;
  colorRgb: number[];
  children: ShapeInfo[];
}

export const getAnimationLayers = (animation: Animation): LayerInfo[] => {
  const layers = animation.layers;
  return layers.map((layer, i) => {
    const path = `layers.${i}`;
    const layerInfo: LayerInfo = {
      path: path,
      name: layer.nm || "Unnamed Layer",
      shapes: [],
    };
    switch (layer.ty) {
      case LayerTypes.Shape:
        layerInfo.shapes = getShapesFromLayer(
          (layer as Layer.Shape).shapes,
          `${path}.shapes`,
        );
        break;
      default:
        break;
    }
    return layerInfo;
  });
};

const getShapesFromLayer = (
  shapes: Shape.Value[],
  parentPath: string,
): ShapeInfo[] => {
  return shapes.map((shape, i) => {
    const path = `${parentPath}.${i}`;
    const shapeInfo: ShapeInfo = {
      path: path,
      name: shape.nm || "Unnamed Shape",
      colorRgb: [],
      children: [],
    };
    switch (shape.ty) {
      case ShapeTypes.Fill:
        shapeInfo.colorRgb = getColorsFromFillShape(shape as Shape.Fill);
        break;
      case ShapeTypes.Stroke:
        shapeInfo.colorRgb = getColorsFromStrokeShape(shape as Shape.Stroke);
        break;
      case ShapeTypes.Group:
        shapeInfo.children = getShapesFromLayer(
          (shape as Shape.Group).it || [],
          `${path}.it`,
        );
        break;
    }

    return shapeInfo;
  });
};

const getColorsFromFillShape = (shape: Shape.Fill): number[] => {
  return toRgbColor(shape.c.k as number[]);
};

const getColorsFromStrokeShape = (shape: Shape.Stroke): number[] => {
  if (shape.c.a === 1) return []; // TODO: handle multiple colors
  return toRgbColor(shape.c.k as number[]);
};

const toRgbColor = (color: number[]): number[] => {
  const [r, g, b, a] = color;

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
    a === undefined ? 1 : a,
  ];
};
