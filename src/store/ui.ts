import { atom } from 'nanostores'

export const $hasOpenFilters = atom(false)

export const $block = atom<string>('');
export const $stand = atom<string>('');