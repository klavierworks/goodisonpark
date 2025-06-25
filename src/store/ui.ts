import { atom } from 'nanostores'

export const $hasOpenFilters = atom(false)

export const $block = atom<string>('');
export const $stand = atom<string>('');

export const $loadProgress = atom(0);

export const $hoveredEntry = atom<Entry | null>(null);

export const $currentView = atom<View>('grid');
export const $selectedEntry = atom<string | null>(null);

export const $isTransitioning = atom(false);