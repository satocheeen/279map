import { ConnectionPool } from '.';
import { PoolConnection } from 'mysql2/promise';
import { ContentsTable, DataLinkTable, DataSourceTable, MapDataSourceLinkTable } from '../279map-backend-common/src/types/schema';
import { CurrentMap } from '../279map-backend-common/src';
import { Auth, ContentsDefine } from './graphql/__generated__/types';
import { DatasourceLocationKindType, DataId, ContentValueMap, MapKind, ContentFieldDefine } from './types-common/common-types';
import { DatasourceTblConfigForContent, ImagesTable } from '../279map-backend-common/src/types';
import { getLogger } from 'log4js';

type GetContentsParam = ({
    itemId: string;
} | {
    contentId: string;
})[];

type ContentsDatasourceRecord = ContentsTable & DataSourceTable & MapDataSourceLinkTable;

const logger = getLogger('api');

export async function getContents({param, currentMap, authLv}: {param: GetContentsParam, currentMap: CurrentMap, authLv: Auth}): Promise<ContentsDefine[]> {
    if (!currentMap) {
        throw 'mapKind not defined.';
    }
    const con = await ConnectionPool.getConnection();

    try {
        const convertRecord = async(row: ContentsDatasourceRecord, itemId?: DataId): Promise<ContentsDefine> => {
            // const id = {
            //     id: row.content_page_id,
            //     dataSourceId: row.data_source_id,
            // };
            const id = row.data_id + '';
            const anotherMapItemIds = await getAnotherMapKindItemsUsingTheContent(con, id, currentMap);
            const usingAnotherMap = anotherMapItemIds.length > 0 ? true : await checkUsingAnotherMap(con, id, currentMap.mapId);

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
                const imageQuery = 'select * from images where data_id = ? and field_key = ?';
                const [rows] = await con.execute(imageQuery, [row.data_id, imageField.key]);
                const ids = (rows as ImagesTable[]).map(row => row.image_id);
                values[imageField.key] = ids;
                if (ids.length > 0) hasImage = true;
            }

            return {
                id,
                datasourceId: row.data_source_id,
                values,
                // parentId: (row.parent_id && row.parent_datasource_id) ? {
                //     id: row.parent_id,
                //     dataSourceId: row.parent_datasource_id,
                // } : undefined,
                usingAnotherMap,
                hasValue,
                hasImage,
                anotherMapItemId: anotherMapItemIds.length > 0 ? anotherMapItemIds[0] : undefined,  // 複数存在する場合は１つだけ返す
                isEditable,
                isDeletable,
            };
        }
        // const getChildren = async(parent: ContentsDatasourceRecord): Promise<ContentsDefine[]> => {
        //     const getChildrenQuery = `
        //         select c.*, ds.*, mdl.mdl_config from contents c
        //         inner join data_source ds on ds.data_source_id = c.data_source_id
        //         inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id
        //         where mdl.map_page_id = ? and c.parent_id = ? AND c.parent_datasource_id = ?
        //         `;
        //     const [rows] = await con.execute(getChildrenQuery, [currentMap.mapId, parent.content_page_id, parent.data_source_id]);
        //     const children = [] as ContentsDefine[];
        //     for (const row of rows as ContentsDatasourceRecord[]) {
        //         const content = await convertRecord(row);
        //         content.children = await getChildren(row);
        //         children.push(content);
        //     }
        //     return children;
        // }
        const allContents = [] as ContentsDefine[];
        for (const target of param) {
            try {
                let myRows: ContentsDatasourceRecord[];
                if ('itemId' in target) {
                    // itemの子コンテンツを取得
                    const sql = `
                    select c.*, ds.*, mdl.mdl_config from contents c 
                    inner join datas d on d.data_id = c.data_id 
                    inner join data_source ds on ds.data_source_id = d.data_source_id
                    inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id
                    inner join data_link dl on dl.to_data_id = c.data_id 
                    where mdl.map_page_id = ? and dl.from_data_id = ?
                    `;
                    const [rows] = await con.execute(sql, [currentMap.mapId, target.itemId]);
                    myRows = rows as ContentsDatasourceRecord[];

                } else {
                    // contentId指定の場合
                    const sql = `
                    select c.*, ds.*, mdl.mdl_config from contents c
                    inner join datas d on d.data_id = c.data_id 
                    inner join data_source ds on ds.data_source_id = d.data_source_id
                    inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id
                    where mdl.map_page_id = ? and c.content_data_id = ?
                    `;
                    const [rows] = await con.execute(sql, [currentMap.mapId, target.contentId]);
                    myRows = rows as ContentsDatasourceRecord[];

                }

                for (const row of myRows) {
                    const content = await convertRecord(row, 'itemId' in target ? target.itemId : undefined);
                    // 子孫コンテンツを取得
                    // content.children = await getChildren(row);
                    allContents.push(content);
                }
            } catch(e) {
                logger.warn('getContents error', target, e);
            }
        }

        return allContents;

    } catch(e) {
        throw 'select contents error. ' + e;

    } finally {
        await con.commit();
        con.release();
    }
}

/**
 * 指定のコンテンツが、もう片方の地図から参照されている場合に、そのItemIDを返す
 * @param con 
 * @param contentId 
 * @param currentMap 
 * @returns 
 */
async function getAnotherMapKindItemsUsingTheContent(con: PoolConnection, contentId: DataId, currentMap: CurrentMap): Promise<DataId[]> {
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
        return row.from_data_id + '';
    });
}

/**
 * 指定のコンテンツが他の地図で使用されているかチェック
 * @param con 
 * @param contentId 
 * @param mapId 
 */
async function checkUsingAnotherMap(con: PoolConnection, contentId: DataId, mapId: string): Promise<boolean> {
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
}