import { createAsyncThunk } from '@reduxjs/toolkit'
import { getContents } from './dataUtility';
import { CategoryDefine, ContentsDefine, EventDefine, ItemDefine } from '../../279map-common';
import { RootState } from '../configureStore';
import { GetCategoryAPI, GetContentsParam, GetEventsAPI, GetItemsAPI, GetItemsParam, GetOriginalIconDefineAPI, GetOriginalIconDefineResult, LinkContentToItemAPI, LinkContentToItemParam, RegistContentAPI, RegistContentParam, RegistItemAPI, RegistItemParam, RemoveContentAPI, RemoveContentParam, RemoveItemAPI, RemoveItemParam, UpdateContentAPI, UpdateContentParam, UpdateItemAPI, UpdateItemParam } from 'tsunagumap-api';
import { getAPICallerInstance } from '../../api/ApiCaller';

export const loadOriginalIconDefine = createAsyncThunk<GetOriginalIconDefineResult>(
    'data/loadOriginalIconDefineStatus',
    async(_, { rejectWithValue }) => {
        try {
            const apiResult = await getAPICallerInstance().callApi(GetOriginalIconDefineAPI, undefined);
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
    async(_, { rejectWithValue }) => {
        try {
            const apiResult = await getAPICallerInstance().callApi(GetEventsAPI, {});

            return apiResult.events;
    
        } catch (e) {
            console.warn('loadEvents error', e);
            return rejectWithValue(e);
        }
    }
)
export const loadCategories = createAsyncThunk<CategoryDefine[]>(
    'data/loadCategoriesStatus',
    async(_, { rejectWithValue }) => {
        try {
            const apiResult = await getAPICallerInstance().callApi(GetCategoryAPI, undefined);

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
            const apiResult = await getAPICallerInstance().callApi(GetItemsAPI, param);

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
    async(param, { rejectWithValue }) => {
        try {
            await getAPICallerInstance().callApi(RegistItemAPI, param);

        } catch (e) {
            console.warn('registFeature error', e);
            return rejectWithValue(e);
        }
    }
)
export const updateFeature = createAsyncThunk<void, UpdateItemParam>(
    'data/updateFeatureStatus',
    async(param, { rejectWithValue }) => {
        try {
            await getAPICallerInstance().callApi(UpdateItemAPI, param);

        } catch (e) {
            console.warn('updateFeature error', e);
            return rejectWithValue(e);
        }
    }
)
export const removeFeature = createAsyncThunk<void, RemoveItemParam>(
    'data/removeFeatureStatus',
    async(param, { rejectWithValue }) => {
        try {
            await getAPICallerInstance().callApi(RemoveItemAPI, param);

        } catch (e) {
            console.warn('removeFeature error', e);
            return rejectWithValue(e);
        }
    }

)
export const registContent = createAsyncThunk<void, RegistContentParam>(
    'data/registContentStatus',
    async(param, { rejectWithValue, dispatch }) => {
        try {
            await getAPICallerInstance().callApi(RegistContentAPI, param);

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
    async(param, { rejectWithValue, dispatch }) => {
        try {
            await getAPICallerInstance().callApi(LinkContentToItemAPI, param);

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
    async(param, { rejectWithValue, dispatch }) => {
        try {
            await getAPICallerInstance().callApi(UpdateContentAPI, param);
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
    async(param, { rejectWithValue, dispatch }) => {
        try {
            await getAPICallerInstance().callApi(RemoveContentAPI, param);

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
