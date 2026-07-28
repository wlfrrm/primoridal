import { atom } from "nanostores";

export const numberValue = atom<number>(1);
export const feedSignal = atom<boolean>(false);
export const reducedTPS = atom<number>(1);
export const toxiSignal = atom<boolean>(false);
export const unitsRemained = atom<number>(3);
export const famineSignal = atom<boolean>(false);
export const killHalfSignal = atom<boolean>(false);
