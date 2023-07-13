import { ConnectionPool } from '.';
import { CurrentMap, ItemContentDefine, schema } from "279map-backend-common";
import { getAncestorItemId } from "./util/utility";
import { GetContentsParam, GetContentsResult } from '../279map-api-interface/src';
import { DataId, MapKind, ContentsDefine, Auth } from '279map-backend-common';
import { PoolConnection } from 'mysql2/promise';

type ContentsDatasourceRecord = schema.ContentsTable & schema.DataSourceTable;
type ItemDataSourceRecord = schema.ItemsTable & schema.DataSourceTable;
type Parent = {
    type: 'item';
    item: ItemDataSourceRecord;
} | {
    type: 'content';
    content: ContentsDatasourceRecord;
}
export async function getContents({ param, currentMap, authLv }: {param: GetContentsParam; currentMap: CurrentMap, authLv: Auth}): Promise<GetContentsResult> {
    if (!currentMap) {
        throw 'mapKind not defined.';
    }
    const mapKind = currentMap.mapKind;
    const con = await ConnectionPool.getConnection();

    try {
        const allContents = [] as ContentsDefine[];

        const convertRecord = async(row: ContentsDatasourceRecord, itemId: DataId): Promise<ContentsDefine> => {
            const contents = row.contents ? row.contents as schema.ContentsInfo: undefined;
            let isSnsContent = false;
            if (row.supplement) {
                // SNSコンテンツの場合
                isSnsContent = true;
            }
            const id = {
                id: row.content_page_id,
                dataSourceId: row.data_source_id,
            };
            const anotherMapItemIds = await getAnotherMapKindItemsUsingTheContent(con, id, currentMap);
            const usingAnotherMap = anotherMapItemIds.length > 0 ? true : await checkUsingAnotherMap(con, id, currentMap.mapId);

            const isEditable = function() {
                if (authLv !== Auth.Edit) return false;
        
                // SNSコンテンツは編集不可
                if (isSnsContent) return false;
        
                return (row.item_contents as ItemContentDefine).Content?.editable ?? false;
            }();

            const isDeletable = function() {
                if (authLv !== Auth.Edit) return false;
        
                // 別の地図で使用されている場合は削除不可にする
                if (usingAnotherMap) return false;
        
                // SNSコンテンツは削除不可
                if (isSnsContent) return false;

                // readonlyは削除不可
                return (row.item_contents as ItemContentDefine).Content?.deletable ?? false;
        
            }();

            return {
                id,
                itemId,
                title: row.title ?? '',
                date: row.date as string,
                category: row.category ? row.category as string[] : [],
                image: row.thumbnail ? true : undefined,
                videoUrl: contents?.videoUrl,
                overview: contents?.content,
                url: contents?.url,
                parentId: (row.parent_id && row.parent_datasource_id) ? {
                    id: row.parent_id,
                    dataSourceId: row.parent_datasource_id,
                } : undefined,
                usingAnotherMap,
                anotherMapItemId: anotherMapItemIds.length > 0 ? anotherMapItemIds[0] : undefined,  // 複数存在する場合は１つだけ返す
                isSnsContent,
                isEditable,
                isDeletable,
            };
        }
        const getChildren = async(parent: ContentsDatasourceRecord, itemId: DataId): Promise<ContentsDefine[]> => {
            const getChildrenQuery = `
                select c.*, ds.* from contents c
                inner join data_source ds on ds.data_source_id = c.data_source_id
                where c.parent_id = ? AND c.parent_datasource_id = ?
                `;
            const [rows] = await con.execute(getChildrenQuery, [parent.content_page_id, parent.data_source_id]);
            const children = [] as ContentsDefine[];
            for (const row of rows as ContentsDatasourceRecord[]) {
                const content = await convertRecord(row, itemId);
                content.children = await getChildren(row, itemId);
                children.push(content);
            }
            return children;
        }
        for (const target of param) {
            let myRows: ContentsDatasourceRecord[];
            let itemId: DataId;
            if ('itemId' in target) {
                // itemの子コンテンツを取得

                itemId = target.itemId;
                const sql = `
                select * from contents c 
                inner join data_source ds on ds.data_source_id = c.data_source_id
                where exists (
                    select icl.* from item_content_link icl 
                    inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id 
                    where i.item_page_id = ? and i.data_source_id = ? and i.map_kind = ?
                    and icl.content_page_id = c.content_page_id and icl.content_datasource_id  = c.data_source_id 
                )
                `;
                const [rows] = await con.execute(sql, [target.itemId.id, target.itemId.dataSourceId, mapKind]);
                myRows = rows as ContentsDatasourceRecord[];

                const itemSql = `
                select i.*, ds.* from items i
                inner join data_source ds on ds.data_source_id = i.data_source_id
                where i.item_page_id = ? and i.data_source_id = ?
                `;
                const [itemRows] = await con.execute(itemSql, [target.itemId.id, target.itemId.dataSourceId]);
            } else {
                // contentId指定の場合

                // 先祖ItemIdを取得
                const myItemId = await getAncestorItemId(con, target.contentId, currentMap);
                if (!myItemId) {
                    throw new Error('item not found.');
                }
                itemId = myItemId;
                const sql = `
                select c.*, ds.* from contents c
                inner join data_source ds on ds.data_source_id = c.data_source_id
                where c.content_page_id = ? and c.data_source_id = ?
                `;
                const [rows] = await con.execute(sql, [target.contentId.id, target.contentId.dataSourceId]);
                myRows = rows as ContentsDatasourceRecord[];

            }

            for (const row of myRows) {
                const content = await convertRecord(row, itemId);
                // 子孫コンテンツを取得
                content.children = await getChildren(row, itemId);
                allContents.push(content);

            }
        }

        return {
            contents: allContents,
        }

    } catch(e) {
        throw 'select contents error' + e;

    } finally {
        await con.commit();
        con.release();
    }
}

/**
 * 指定のコンテンツが、もう片方の地図に存在する場合に、そのItemIDを返す
 * @param con 
 * @param contentId 
 * @param currentMap 
 * @returns 
 */
async function getAnotherMapKindItemsUsingTheContent(con: PoolConnection, contentId: DataId, currentMap: CurrentMap): Promise<DataId[]> {
    // もう片方の地図に存在するかチェック
    const sql = `
    select icl.* from item_content_link icl 
    inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id 
    inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
    where icl.content_page_id = ? and icl.content_datasource_id  = ?
    and mdl.map_page_id = ? and i.map_kind = ?
    `;
    const anotherMapKind = currentMap.mapKind === MapKind.Virtual ? MapKind.Real : MapKind.Virtual;
    const [rows] = await con.execute(sql, [contentId.id, contentId.dataSourceId, currentMap.mapId, anotherMapKind]);

    return (rows as schema.ItemContentLink[]).map((row): DataId => {
        return {
            id: row.item_page_id,
            dataSourceId: row.item_datasource_id,
        }
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
    select icl.* from item_content_link icl 
    inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id 
    inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
    where icl.content_page_id = ? and icl.content_datasource_id  = ?
    and mdl.map_page_id <> ?
    `;
    const [rows] = await con.execute(sql, [contentId.id, contentId.dataSourceId, mapId]);
    return (rows as []).length > 0;
}