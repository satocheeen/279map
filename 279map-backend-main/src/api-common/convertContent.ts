import { DataSourceTable, ContentsTable, CurrentMap, DataLinkTable, ImagesTable, MapDataSourceLinkTable } from "../../279map-backend-common/src";
import { Auth, ContentsDefine } from "../graphql/__generated__/types";
import { ContentFieldDefine, ContentValueMap, DataId, DatasourceLocationKindType, MapKind } from "../types-common/common-types";
import { ConnectionPool } from "..";

type Record = ContentsTable & DataSourceTable & MapDataSourceLinkTable;

/**
 * contentsテーブルの値をContentsDefineの形式に変換して返す
 * @param row
 */
export async function convertContentsToContentsDefine(row: Record, currentMap: CurrentMap, authLv: Auth): Promise<ContentsDefine> {

    const id = row.data_id;
    const anotherMapItemIds = await getAnotherMapKindItemsUsingTheContent(id, currentMap);
    const usingOtherMap = anotherMapItemIds.length > 0 ? true : await checkUsingAnotherMap(id, currentMap.mapId);

    const readonly = function() {
        if (row.location_kind === DatasourceLocationKindType.VirtualItem) return true;
        return row.config.readonly;
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

                // 値があるかどうかチェック
                const value = values[key];
                if (!value) return;
                // -- タイトルは値と見做さない
                if (key === titleField?.key) return;
                const def = row.contents_define?.find(def => def.key === key);
                if (!def) return;
                if (def.type === 'category' && (value as string[]).length === 0) {
                    // category項目で配列0なら、値ありと見做さない
                    return;
                }
                if (def.type === 'image' && (value as string[]).length === 0) {
                    // image項目で配列0なら、値ありと見做さない
                    return;
                }
                if ((def.type === 'string' || def.type === 'text') && (value as string).length === 0) {
                    // テキスト項目で文字数0なら、値ありと見做さない
                    return;
                }
                hasValue = true;
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
        hasValue,
        hasImage,
        anotherMapItemId: anotherMapItemIds.length > 0 ? anotherMapItemIds[0] : undefined,  // 複数存在する場合は１つだけ返す
        usingOtherMap,
        readonly,
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
        select dl.from_data_id as data_id from data_link dl 
        where dl.to_data_id = ?
        and EXISTS (
            select * from datas d
            inner join data_source ds on ds.data_source_id = d.data_source_id 
            inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
            where mdl.map_page_id = ? and ds.location_kind in (?)
            and d.data_id = dl.from_data_id 
        )
        union
        select d2.data_id from datas d2
        inner join geometry_items gi on gi.data_id = d2.data_id 
        inner join data_source ds2 on ds2.data_source_id = d2.data_source_id 
        inner join map_datasource_link mdl2 on mdl2.data_source_id = d2.data_source_id 
        where d2.data_id = ?
        and mdl2.map_page_id = ? and ds2.location_kind in (?)
        `;
        const anotherMapKind = currentMap.mapKind === MapKind.Virtual ? [DatasourceLocationKindType.RealItem, DatasourceLocationKindType.Track] : [DatasourceLocationKindType.VirtualItem];
        const query = con.format(sql, [contentId, currentMap.mapId, anotherMapKind, contentId, currentMap.mapId, anotherMapKind]);
        const [rows] = await con.execute(query);

        return (rows as {data_id: DataId}[]).map((row): DataId => {
            return row.data_id;
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