import { ConnectionPool } from '.';
import { getAncestorItemId } from "./util/utility";
import { PoolConnection } from 'mysql2/promise';
import { ContentsInfo, ContentsTable, DataSourceTable, ItemContentLink } from '../279map-backend-common/src/types/schema';
import { CurrentMap, DatasourceConfig } from '../279map-backend-common/src';
import { Auth, ContentsDefine, MapKind } from './graphql/__generated__/types';
import { DatasourceKindType, DataId } from './types-common/common-types';
import dayjs from 'dayjs';

type GetContentsParam = ({
    itemId: DataId;
} | {
    contentId: DataId;
})[];

type ContentsDatasourceRecord = ContentsTable & DataSourceTable;
export async function getContents({param, currentMap, authLv}: {param: GetContentsParam, currentMap: CurrentMap, authLv: Auth}): Promise<ContentsDefine[]> {
    if (!currentMap) {
        throw 'mapKind not defined.';
    }
    const con = await ConnectionPool.getConnection();

    try {
        const allContents = [] as ContentsDefine[];

        const convertRecord = async(row: ContentsDatasourceRecord, itemId: DataId): Promise<ContentsDefine> => {
            const contents = row.contents ? row.contents as ContentsInfo: undefined;
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
                if (authLv === Auth.None || authLv === Auth.View) {
                    return false;
                }
                // SNSコンテンツは編集不可
                if (isSnsContent) return false;
        
                const config = (row.config as DatasourceConfig);
                return 'editable' in config ? config.editable : false;
            }();

            const isDeletable = function() {
                if (authLv === Auth.None || authLv === Auth.View) {
                    return false;
                }
                // 別の地図で使用されている場合は削除不可にする
                if (usingAnotherMap) return false;
        
                // SNSコンテンツは削除不可
                if (isSnsContent) return false;

                // readonlyは削除不可
                const config = (row.config as DatasourceConfig);
                return 'deletable' in config ? config.deletable : false;
        
            }();

            // 現状、時刻ありなしを区別できないので、ひとまず00:00を「時刻なし」と判定
            const date = function() {
                if (!row.date) return;
                const dj = dayjs(row.date);
                if (dj.format('HH:mm') === '00:00') {
                    return dj.format('YYYY-MM-DD');
                } else {
                    return dj.format('YYYY-MM-DD HH:mm');
                }
            }();

            return {
                id,
                itemId,
                title: row.title ?? '',
                date,
                category: row.category ? row.category as string[] : [],
                image: row.thumbnail ? true : false,
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
                select c.*, ds.* from contents c 
                inner join data_source ds on ds.data_source_id = c.data_source_id
                inner join item_content_link icl on c.content_page_id = icl.content_page_id and c.data_source_id = icl.content_datasource_id 
                where icl.item_page_id = ? and icl.item_datasource_id  = ?
                `;
                const [rows] = await con.execute(sql, [target.itemId.id, target.itemId.dataSourceId]);
                myRows = rows as ContentsDatasourceRecord[];

            } else {
                // contentId指定の場合

                // 先祖ItemIdを取得
                const myItemId = await getAncestorItemId(con, target.contentId, currentMap);
                if (!myItemId) {
                    throw new Error('item not found.' + JSON.stringify(target.contentId));
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

        return allContents;

    } catch(e) {
        throw 'select contents error. ' + e;

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
    inner join data_source ds on ds.data_source_id = i.data_source_id 
    inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
    where icl.content_page_id = ? and icl.content_datasource_id  = ?
    and mdl.map_page_id = ? and ds.kind in (?)
    `;
    const anotherMapKind = currentMap.mapKind === MapKind.Virtual ? [DatasourceKindType.RealItem, DatasourceKindType.RealPointContent] : [DatasourceKindType.VirtualItem];
    const query = con.format(sql, [contentId.id, contentId.dataSourceId, currentMap.mapId, anotherMapKind]);
    const [rows] = await con.execute(query);

    return (rows as ItemContentLink[]).map((row): DataId => {
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