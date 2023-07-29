import { useCallback } from 'react';
import { useMap } from '../../components/map/useMap';
import { GetContentsParam, LinkContentToItemAPI, LinkContentToItemParam, RegistContentAPI, RegistContentParam, RemoveContentAPI, RemoveContentParam, UpdateContentAPI, UpdateContentParam } from 'tsunagumap-api';
import { contentsState } from './itemAtom';
import { useSetRecoilState } from 'recoil';

export function useContents() {
    const setContents = useSetRecoilState(contentsState);
    const { getApi } = useMap();

    const loadContents = useCallback(async(targets: GetContentsParam) => {
        try {
            const result = await getApi().getContents(targets);
            setContents(result);
            return result;
    
        } catch (e) {
            console.warn('loadContents error', e);
            throw e;
        }

    }, [getApi, setContents]);

    const registContent = useCallback(async(param: RegistContentParam) => {
        try {
            await getApi().callApi(RegistContentAPI, param);

            // 最新コンテンツロード
            loadContents([param.parent]);
 
        } catch(e) {
            console.warn('registContent error', e);
            throw e;
        }

    }, [getApi, loadContents]);

    const linkContentToItem = useCallback(async(param: LinkContentToItemParam) => {
        try {
            await getApi().callApi(LinkContentToItemAPI, param);

            // 最新コンテンツロード
            loadContents([param.parent]);

        } catch(e) {
            console.warn('linkContentToItem error', e);
            throw e;
        }

    }, [getApi, loadContents]);

    const updateContent = useCallback(async(param: UpdateContentParam) => {
        try {
            await getApi().callApi(UpdateContentAPI, param);

            // 最新コンテンツロード
            loadContents([{
                contentId: param.id,
            }]);
    
        } catch(e) {
            console.warn('updateContent error', e);
            throw e;
        }

    }, [getApi, loadContents]);

    const removeContent = useCallback(async(param: RemoveContentParam) => {
        try {
            await getApi().callApi(RemoveContentAPI, param);

            if (param.parentContentId) {
                // 最新コンテンツロード
                loadContents([{
                    contentId: param.parentContentId,
                }]);
            }

            return param;

        } catch(e) {
            console.warn('removeContent error', e);
            throw e;
        }

    }, [getApi, loadContents]);

    return {
        loadContents,
        registContent,
        linkContentToItem,
        updateContent,
        removeContent,
    }
}