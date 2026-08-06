import { atom } from "jotai";
import { ConfirmParam, ConfirmResult } from "./types";

export const showConfirmDialogAtom = atom<boolean>(false);

export const confirmInfoAtom = atom<undefined | ConfirmParam>(undefined);

export const confirmResultAtom = atom<undefined | ConfirmResult>(undefined);
