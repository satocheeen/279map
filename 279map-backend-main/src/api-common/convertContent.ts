import { ContentsTable, CurrentMap, DataLinkTable, ImagesTable, MapDataSourceLinkTable } from "../../279map-backend-common/src";
import { Auth, ContentsDefine } from "../graphql/__generated__/types";
import { ContentFieldDefine, ContentValueMap, DataId, DatasourceLocationKindType, MapKind } from "../types-common/common-types";
import { ConnectionPool } from "..";
import { DataSourceTable } from "../../279map-backend-common/dist";

type Record = ContentsTable & DataSourceTable & MapDataSourceLinkTable;

/**
 * contentsテーブルの値をContentsDefineの形式に変換して返す
 * @param row
 */
export async function convertContentsToContentsDefine(row: Record, currentMap: CurrentMap, authLv: Auth): Promise<ContentsDefine> {

    const id = row.data_id;
    const anotherMapItemIds = await getAnotherMapKindItemsUsingTheContent(id, currentMap);
    const usingAnotherMap = anotherMapItemIds.length > 0 ? true : await checkUsingAnotherMap(id, currentMap.mapId);

    const isEditable = function() {
        if (authLv === Auth.None || authLv === Auth.View) {
            return false;
        }
        if (row.location_kind === DatasourceLocationKindType.VirtualItem) return true;

        return row.config.readonly ? false : true;
    }();

    const isDeletable = function() {
        if (authLv === Auth.None || authLv === Auth.View) {
            return false;
        }

        // アイテムと対になっているコンテンツは削除不可
        // TODO: itemテーブルに同一IDのレコードが存在するか確認
        // if (row.kind === DatasourceLocationKindType.RealPointContent && itemId && isEqualId(itemId, { id: row.content_page_id, dataSourceId: row.data_source_id})) {
        //     return false;
        // }
        if (row.location_kind === DatasourceLocationKindType.VirtualItem) return false;

        // 別の地図で使用されている場合は削除不可にする
        if (usingAnotherMap) return false;

        // readonlyは削除不可
        return row.config.readonly ? false : true;
    }();

    let hasValue = false;
    const titleField = function() {
        const contentsDefine = row.contents_define as ContentFieldDefine[];
        return contentsDefine.find(fd => fd.type === 'title');
    }();

    // 使用する項目に絞る
    const values: ContentValueMap = function() {
        if (row.location_kind === DatasourceLocationKindType.VirtualItem) return row.contents ?? {};
        
        const allValues = row.contents ?? {};
        const values: ContentValueMap = {};
        if ('contentFieldKeyList' in row.mdl_config) {
            row.mdl_config.contentFieldKeyList.forEach(key => {
                values[key] = allValues[key];

                if (key !== titleField?.key) {
                    hasValue = true;
                }
            });
        }
        return values;
    }();

    // 画像が存在する場合は、valuesにIDを含めて返す
    let hasImage = false;
    const imageFields = function() {
        const contentsDefine = row.contents_define as ContentFieldDefine[];
        return contentsDefine.filter(fd => fd.type === 'image');
    }() ?? [];
    for (const imageField of imageFields) {
        const ids = await getImageIdList(row.data_id, imageField);
        values[imageField.key] = ids;
        if (ids.length > 0) hasImage = true;
    }

    return {
        id,
        datasourceId: row.data_source_id,
        values,
        usingAnotherMap,
        hasValue,
        hasImage,
        anotherMapItemId: anotherMapItemIds.length > 0 ? anotherMapItemIds[0] : undefined,  // 複数存在する場合は１つだけ返す
        isEditable,
        isDeletable,
    };
}

/**
 * 指定のコンテンツが、もう片方の地図から参照されている場合に、そのItemIDを返す
 * @param con 
 * @param contentId 
 * @param currentMap 
 * @returns 
 */
async function getAnotherMapKindItemsUsingTheContent(contentId: DataId, currentMap: CurrentMap): Promise<DataId[]> {
    const con = await ConnectionPool.getConnection();

    try {
        // もう片方の地図に存在するかチェック
        const sql = `
        select * from data_link dl 
        where dl.to_data_id = ?
        and EXISTS (
            select * from datas d
            inner join data_source ds on ds.data_source_id = d.data_source_id 
            inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
            where mdl.map_page_id = ? and ds.location_kind in (?)
            and d.data_id = dl.from_data_id 
        )
        `;
        const anotherMapKind = currentMap.mapKind === MapKind.Virtual ? [DatasourceLocationKindType.RealItem, DatasourceLocationKindType.Track] : [DatasourceLocationKindType.VirtualItem];
        const query = con.format(sql, [contentId, currentMap.mapId, anotherMapKind]);
        const [rows] = await con.execute(query);

        return (rows as DataLinkTable[]).map((row): DataId => {
            return row.from_data_id;
        });

    } finally {
        con.release();
    }
}

/**
 * 指定のコンテンツが他の地図で使用されているかチェック
 * @param con 
 * @param contentId 
 * @param mapId 
 */
async function checkUsingAnotherMap(contentId: DataId, mapId: string): Promise<boolean> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
        select * from data_link dl 
        where dl.to_data_id = ?
        and EXISTS (
            select * from datas d
            inner join data_source ds on ds.data_source_id = d.data_source_id 
            inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
            where mdl.map_page_id <> ?
            and d.data_id = dl.from_data_id 
        )
        `;
        const [rows] = await con.execute(sql, [contentId, mapId]);
        return (rows as []).length > 0;
    
    } finally {
        (await con).release();
    }
}

/**
 * 指定のデータの指定のイメージ列に属する画像IDリストを返す
 * @param dataId
 * @param imageField 
 */
async function getImageIdList(dataId: DataId, imageField: ContentFieldDefine): Promise<ContentValueMap> {
    const con = await ConnectionPool.getConnection();

    try {
        const imageQuery = 'select * from images where data_id = ? and field_key = ?';
        const [rows] = await con.execute(imageQuery, [dataId, imageField.key]);
        const ids = (rows as ImagesTable[]).map(row => row.image_id);
        return ids;
    
    } finally {
        con.release();
    }

}