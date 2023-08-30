import { ItemDefine } from '279map-common';
import { atom as recoilAtom } from 'recoil';
import { atom } from 'jotai';

export type ItemsMap = {[id: string]: ItemDefine};
type ItemsByDatasourceMap = {[dsId: string]: ItemsMap};
export const allItemsAtom = atom({} as ItemsByDatasourceMap);

// アイテムの初回ロード完了しているかどうかのフラグ
export const initialItemLoadedState = recoilAtom<boolean>({
    key: 'initialItemLoadedAtom',
    default: false,
})