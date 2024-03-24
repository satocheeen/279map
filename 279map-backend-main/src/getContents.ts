import { ConnectionPool } from '.';
import { PoolConnection } from 'mysql2/promise';
import { ContentsTable, DataSourceTable, ItemContentLink, MapDataSourceLinkConfig, MapDataSourceLinkTable } from '../279map-backend-common/src/types/schema';
import { CurrentMap } from '../279map-backend-common/src';
import { Auth, ContentsDefine, MapKind } from './graphql/__generated__/types';
import { DatasourceKindType, DataId, ContentValueMap } from './types-common/common-types';
import { isEqualId } from './util/utility';
import { DatasourceTblConfig, ImagesTable } from '../279map-backend-common/dist';

type GetContentsParam = ({
    itemId: DataId;
} | {
    contentId: DataId;
})[];

type ContentsDatasourceRecord = ContentsTable & DataSourceTable & MapDataSourceLinkTable;
export async function getContents({param, currentMap, authLv}: {param: GetContentsParam, currentMap: CurrentMap, authLv: Auth}): Promise<ContentsDefine[]> {
    if (!currentMap) {
        throw 'mapKind not defined.';
    }
    const con = await ConnectionPool.getConnection();

    try {
        const allContents = [] as ContentsDefine[];

        const convertRecord = async(row: ContentsDatasourceRecord, itemId?: DataId): Promise<ContentsDefine> => {
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
        
                const config = (row.config as DatasourceTblConfig);
                return 'editable' in config ? config.editable : false;
            }();

            const isDeletable = function() {
                if (authLv === Auth.None || authLv === Auth.View) {
                    return false;
                }

                // アイテムと対になっているコンテンツは削除不可
                if (row.kind === DatasourceKindType.RealPointContent && itemId && isEqualId(itemId, { id: row.content_page_id, dataSourceId: row.data_source_id})) {
                    return false;
                }

                // 別の地図で使用されている場合は削除不可にする
                if (usingAnotherMap) return false;
        
                // SNSコンテンツは削除不可
                if (isSnsContent) return false;

                // readonlyは削除不可
                const config = (row.config as DatasourceTblConfig);
                return 'deletable' in config ? config.deletable : false;
        
            }();

            const values = row.contents as ContentValueMap;

            // 画像が存在する場合は、valuesにIDを含めて返す
            const imageFields = function() {
                const mdlConfig = row.mdl_config as MapDataSourceLinkConfig;
                if ('fields' in mdlConfig) {
                    return mdlConfig.fields.filter(fd => fd.type === 'image');
                }
            }() ?? [];
            for (const imageField of imageFields) {
                const imageQuery = 'select * from images where content_page_id = ? and data_source_id = ? and field_key = ?';
                const [rows] = await con.execute(imageQuery, [row.content_page_id, row.data_source_id, imageField.key]);
                const ids = (rows as ImagesTable[]).map(row => row.image_id);
                values[imageField.key] = ids;
            }

            return {
                id,
                values,
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
        const getChildren = async(parent: ContentsDatasourceRecord): Promise<ContentsDefine[]> => {
            const getChildrenQuery = `
                select c.*, ds.*, mdl.mdl_config from contents c
                inner join data_source ds on ds.data_source_id = c.data_source_id
                inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id
                where mdl.map_page_id = ? and c.parent_id = ? AND c.parent_datasource_id = ?
                `;
            const [rows] = await con.execute(getChildrenQuery, [currentMap.mapId, parent.content_page_id, parent.data_source_id]);
            const children = [] as ContentsDefine[];
            for (const row of rows as ContentsDatasourceRecord[]) {
                const content = await convertRecord(row);
                content.children = await getChildren(row);
                children.push(content);
            }
            return children;
        }
        for (const target of param) {
            let myRows: ContentsDatasourceRecord[];
            if ('itemId' in target) {
                // itemの子コンテンツを取得
                const sql = `
                select c.*, ds.*, mdl.mdl_config from contents c 
                inner join data_source ds on ds.data_source_id = c.data_source_id
                inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id
                inner join item_content_link icl on c.content_page_id = icl.content_page_id and c.data_source_id = icl.content_datasource_id 
                where mdl.map_page_id = ? and icl.item_page_id = ? and icl.item_datasource_id  = ?
                `;
                const [rows] = await con.execute(sql, [currentMap.mapId, target.itemId.id, target.itemId.dataSourceId]);
                myRows = rows as ContentsDatasourceRecord[];

            } else {
                // contentId指定の場合

                const sql = `
                select c.*, ds.*, mdl.mdl_config from contents c
                inner join data_source ds on ds.data_source_id = c.data_source_id
                inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id
                where mdl.map_page_id = ? and c.content_page_id = ? and c.data_source_id = ?
                `;
                const [rows] = await con.execute(sql, [currentMap.mapId, target.contentId.id, target.contentId.dataSourceId]);
                myRows = rows as ContentsDatasourceRecord[];

            }

            for (const row of myRows) {
                const content = await convertRecord(row, 'itemId' in target ? target.itemId : undefined);
                // 子孫コンテンツを取得
                content.children = await getChildren(row);
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