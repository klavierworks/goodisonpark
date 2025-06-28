import { PlaneGeometry, type CanvasTexture, type Texture } from "three";

export const thumbnailCache = new Map<string, Texture>();

export const videoTextureCache = new Map<string, Texture>();

export const canvasTextureCache = new Map<string, CanvasTexture>();

export const tileGeometry = new PlaneGeometry(1, 1);