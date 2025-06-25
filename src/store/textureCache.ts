import type { CanvasTexture, Texture } from "three";

export const thumbnailCache = new Map<string, Texture>();

export const videoTextureCache = new Map<string, Texture>();

export const canvasTextureCache = new Map<string, CanvasTexture>();