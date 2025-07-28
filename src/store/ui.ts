import { atom } from 'nanostores'

export const $hasOpenFilters = atom(false)

export const $block = atom<string>('');

export const $loadProgress = atom(0);

export const $hoveredEntry = atom<Entry | null>(null);
export const $hoveredWithIntentionEntryId = atom<string | null>(null);

export const $currentView = atom<View>('space');
export const $currentlyViewingSpace = atom<View>('space');
export const $selectedEntry = atom<string | null>(null);

export const $isTransitioning = atom(false);

export const $isDebug = atom(() => {
  const url = new URL(window.location.href);
  return url.searchParams.get('isDebug') === 'true';
});