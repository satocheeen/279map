import { Getter, atom } from "jotai";

/**
 * 「接頭辞＋カウント値」の値を保持するAtomを生成する。
 * setするたびにカウントアップされる。
 * @param pre 
 * @returns 
 */
export function atomWithCountup(pre: string) {
    const countAtom = atom(0);
    return atom(
        (get) => pre + get(countAtom),
        (get, set) => {
            set(countAtom, (prev) => prev + 1)
        },
    );
}
