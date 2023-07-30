import { atom } from 'recoil';

export const instanceIdState = atom<string>({
    key: 'instanceIdState',
    default: '',
})

export const mapIdState = atom<string>({
    key: 'mapIdState',
    default: '',
});

