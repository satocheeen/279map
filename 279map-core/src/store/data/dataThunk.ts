import { createAsyncThunk } from '@reduxjs/toolkit'
import { callApi } from '../../api/api';
import { getContents } from './dataUtility';
import { CategoryDefine, ContentsDefine, EventDefine, ItemDefine } from '../../279map-common';
import { RootState } from '../configureStore';
import { GetCategoryAPI, GetContentsParam, GetEventsAPI, GetItemsAPI, GetItemsParam, GetOriginalIconDefineAPI, GetOriginalIconDefineResult, LinkContentToItemAPI, LinkContentToItemParam, RegistContentAPI, RegistContentParam, RegistItemAPI, RegistItemParam, RemoveContentAPI, RemoveContentParam, RemoveItemAPI, RemoveItemParam, UpdateContentAPI, UpdateContentParam, UpdateItemAPI, UpdateItemParam } from 'tsunagumap-api';

export const loadOriginalIconDefine = createAsyncThunk<GetOriginalIconDefineResult>(
    'data/loadOriginalIconDefineStatus',
    async(_, { rejectWithValue, getState }) => {
        try {
            const mapServer = (getState() as RootState).session.mapServer;
            const apiResult = await callApi(mapServer, GetOriginalIconDefineAPI, undefined);
            return apiResult;
        } catch(e) {
            console.warn('getOriginalIconDefine error', e);
            return rejectWithValue(e);
        }
    }
);
// イベント情報ロード
export const loadEvents = createAsyncThunk<EventDefine[]>(
    'data/loadEventsStatus',
    async(_, { rejectWithValue, getState }) => {
        try {
            const mapServer = (getState() as RootState).session.mapServer;
            const apiResult = await callApi(mapServer, GetEventsAPI, {});

            return apiResult.events;
    
        } catch (e) {
            console.warn('loadEvents error', e);
            return rejectWithValue(e);
        }
    }
)
export const loadCategories = createAsyncThunk<CategoryDefine[]>(
    'data/loadCategoriesStatus',
    async(_, { rejectWithValue, getState }) => {
        try {
            const mapServer = (getState() as RootState).session.mapServer;
            const apiResult = await callApi(mapServer, GetCategoryAPI, undefined);

            return apiResult.categories;
    
        } catch (e) {
            console.warn('loadEvents error', e);
            return rejectWithValue(e);
        }
    }
)
/**
 * 指定のズームLv., extentに該当するアイテムをロードする
 */
export const loadItems = createAsyncThunk<ItemDefine[], GetItemsParam>(
    'data/loadItemsStatus',
    async(param, { rejectWithValue, getState  }) => {
        try {
            const mapServer = (getState() as RootState).session.mapServer;
            const apiResult = await callApi(mapServer, GetItemsAPI, param);

            return apiResult.items;
    
        } catch (e) {
            console.warn('loadItems error', e);
            return rejectWithValue(e);
        }
    }
)
type LoadContentsParam = {
    targets: GetContentsParam;
    keepCurrentData?: boolean;     // trueの場合、ストア内の既存コンテンツをそのまま残す
}
type LoadContentsResult = {
    contents: ContentsDefine[];
    keepCurrentData?: boolean;     // trueの場合、ストア内の既存コンテンツをそのまま残す
}
export const loadContents = createAsyncThunk<LoadContentsResult, LoadContentsParam>(
    'data/loadContentsStatus',
    async(param, { rejectWithValue, getState }) => {
        try {
            const mapServer = (getState() as RootState).session.mapServer;
            const result = await getContents(mapServer, param.targets);
            return {
                contents: result,
                keepCurrentData: param.keepCurrentData,
            };
    
        } catch (e) {
            console.warn('loadContents error', e);
            return rejectWithValue(e);
        }

    }
)
export const registFeature = createAsyncThunk<void, RegistItemParam>(
    'data/registFeatureStatus',
    async(param, { rejectWithValue, getState }) => {
        try {
            const mapServer = (getState() as RootState).session.mapServer;
            await callApi(mapServer, RegistItemAPI, param);

        } catch (e) {
            console.warn('registFeature error', e);
            return rejectWithValue(e);
        }
    }
)
export const updateFeature = createAsyncThunk<void, UpdateItemParam>(
    'data/updateFeatureStatus',
    async(param, { rejectWithValue, getState }) => {
        try {
            const mapServer = (getState() as RootState).session.mapServer;
            await callApi(mapServer, UpdateItemAPI, param);

        } catch (e) {
            console.warn('updateFeature error', e);
            return rejectWithValue(e);
        }
    }
)
export const removeFeature = createAsyncThunk<void, RemoveItemParam>(
    'data/removeFeatureStatus',
    async(param, { rejectWithValue, getState }) => {
        const mapServer = (getState() as RootState).session.mapServer;
        try {
            await callApi(mapServer, RemoveItemAPI, param);

        } catch (e) {
            console.warn('removeFeature error', e);
            return rejectWithValue(e);
        }
    }

)
export const registContent = createAsyncThunk<void, RegistContentParam>(
    'data/registContentStatus',
    async(param, { rejectWithValue, dispatch, getState }) => {
        try {
            const mapServer = (getState() as RootState).session.mapServer;
            await callApi(mapServer, RegistContentAPI, param);

            // 最新コンテンツロード
            await dispatch(loadContents({
                targets: [param.parent],
            }));
 
        } catch(e) {
            console.warn('registContent error', e);
            return rejectWithValue(e);
        }
    }
)
export const linkContentToItem = createAsyncThunk<void, LinkContentToItemParam>(
    'data/linkContentToItemStatus',
    async(param, { rejectWithValue, dispatch, getState }) => {
        try {
            const mapServer = (getState() as RootState).session.mapServer;
            await callApi(mapServer, LinkContentToItemAPI, param);

            // 最新コンテンツロード
            await dispatch(loadContents({
                targets: [param.parent],
            }));

        } catch(e) {
            console.warn('linkContentToItem error', e);
            return rejectWithValue(e);
        }
    }
)
export const updateContent = createAsyncThunk<void, UpdateContentParam>(
    'data/updateContentStatus',
    async(param, { rejectWithValue, dispatch, getState }) => {
        try {
            const mapServer = (getState() as RootState).session.mapServer;
            await callApi(mapServer, UpdateContentAPI, param);
            // 最新コンテンツロード
            await dispatch(loadContents({
                targets: [{
                    contentId: param.id,
                }],
                keepCurrentData: true,
            }));
    
        } catch(e) {
            console.warn('updateContent error', e);
            return rejectWithValue(e);
        }
    }
)
export const removeContent = createAsyncThunk<RemoveContentParam, RemoveContentParam>(
    'data/removeContentStatus',
    async(param, { rejectWithValue, dispatch, getState }) => {
        try {
            const mapServer = (getState() as RootState).session.mapServer;
            await callApi(mapServer, RemoveContentAPI, param);

            if (param.parentContentId) {
                // 最新コンテンツロード
                await dispatch(loadContents({
                    targets: [{
                        contentId: param.parentContentId,
                    }],
                    keepCurrentData: true,
                }));
            }

            return param;

        } catch(e) {
            console.warn('removeContent error', e);
            return rejectWithValue(e);
        }
    }
)
