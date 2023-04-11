import { ConnectionPool } from '.';
import { CurrentMap, getDataSourceKindsFromMapKind, schema, DataId } from "279map-backend-common";
import { getBelongingItem, getContent } from "./util/utility";
import { PoolConnection } from "mysql2/promise";
import { GetContentsParam, GetContentsResult } from '../279map-api-interface/src';
import { ContentsDefine, MapKind } from '279map-backend-common';
import mysql from 'mysql2/promise';

type RetRecord = schema.ContentsTable & {item_page_id: string; item_data_source_id: string; /*another_item_id: string|null;*/};

export async function getContents({ param, currentMap }: {param: GetContentsParam; currentMap: CurrentMap}): Promise<GetContentsResult> {
    if (!currentMap) {
        throw 'mapKind not defined.';
    }
    const mapKind = currentMap.mapKind;
    const con = await ConnectionPool.getConnection();

    try {
        const allContents = [] as ContentsDefine[];

        const convertRecord = async(row: RetRecord): Promise<ContentsDefine> => {
            const sql = 'select * from item_content_link where content_page_id = ?';
            const [rows] = await con.execute(sql, [row.content_page_id]);
            const another_item_ids =  (rows as schema.ItemContentLink[])
                                        .filter(record => record.item_page_id !== row.item_page_id)
                                        .reduce((acc, cur) => {
                                            const exist = acc.some(item => {
                                                return item.id === cur.item_page_id && item.dataSourceId === cur.item_data_source_id;
                                            });
                                            if (!exist) {
                                                return acc.concat({
                                                    id: cur.item_page_id,
                                                    dataSourceId: cur.item_data_source_id
                                                });
                                            } else {
                                                return acc;
                                            }
                                        }, [] as DataId[]);

            const contents = row.contents ? JSON.parse(row.contents) as schema.ContentsInfo: undefined;
            let isSnsContent = false;
            let addableChild = true;
            if (row.supplement) {
                const supplement = JSON.parse(row.supplement);
                isSnsContent = supplement.type === 'SnsContent';
                addableChild = false;
            }
            return {
                    id: {
                        id: row.content_page_id,
                        dataSourceId: row.data_source_id,
                    },
                    itemId: {
                        id: row.item_page_id,
                        dataSourceId: row.item_data_source_id,
                    },
                    title: row.title ?? '',
                    date: row.date,
                    category: row.category ? JSON.parse(row.category) : [],
                    image: row.thumbnail ? true : undefined,
                    videoUrl: contents?.videoUrl,
                    overview: contents?.content,
                    url: contents?.url,
                    parentId: (row.parent_id && row.parent_data_sourceid) ? {
                        id: row.parent_id,
                        dataSourceId: row.parent_data_sourceid,
                    } : undefined,
                    anotherMapItemId: another_item_ids.length === 0 ? undefined : another_item_ids[0],  // 複数存在する場合は１つだけ返す
                    isSnsContent,
                    addableChild,
                    readonly: row.readonly ? true : false,
                };
        }
        const getChildren = async(contentId: DataId): Promise<ContentsDefine[]> => {
            const getChildrenQuery = `
                select c.*, i.item_page_id, i.data_sourceid as item_data_source_id from contents c
                inner join item_content_link icl on icl.content_page_id = c.content_page_id 
                inner join items i on i.item_page_id = icl.item_page_id 
                where c.parent_id = ? AND c.parent_datasource_id = ?
                `;
            const [rows] = await con.execute(getChildrenQuery, [contentId.id, contentId.dataSourceId]);
            const children = [] as ContentsDefine[];
            for (const row of rows as RetRecord[]) {
                const content = await convertRecord(row);
                content.children = await getChildren(content.id);
                children.push(content);
            }
            return children;
        }
        for (const target of param) {
            let myRows: RetRecord[];
            if ('itemId' in target) {
                const kinds = getDataSourceKindsFromMapKind(mapKind, { item: true });
                const sql = `
                select c.*, i.item_page_id, ds.kind from contents c
                inner join item_content_link icl on icl.content_page_id = c.content_page_id 
                inner join items i on i.item_page_id = icl.item_page_id 
                inner join data_source ds on ds.data_source_id = i.data_source_id
                group by c.content_page_id, i.item_page_id 
                having i.item_page_id = ? and ds.kind in (?)
                `;
                const query = mysql.format(sql, [target.itemId, kinds]);
                const [rows] = await con.execute(query);
                // const [rows] = await con.execute(sql, [target.itemId, kinds]);
                myRows = rows as RetRecord[];
            } else {
                myRows = await getContentInfo(con, target.contentId, currentMap.mapId,currentMap.mapKind);

            }
            for (const row of myRows) {
                const content = await convertRecord(row);
                // 子孫コンテンツを取得
                content.children = await getChildren(content.id);
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

async function getContentInfo(con: PoolConnection, content_page_id: string, mapPageId: string, mapKind: MapKind): Promise<RetRecord[]> {
    const contentRec = await getContent(content_page_id);
    if (!contentRec) {
        return [];
    }
    const currentMapItem = await getBelongingItem(con, contentRec, mapPageId, mapKind);
    if (!currentMapItem) {
        return [];
    }
    const anotherMapKind = mapKind === MapKind.Real ? MapKind.Virtual: MapKind.Real;
    // const anotherMapItems = await getBelongingItem(con, contentRec, mapPageId, anotherMapKind);
    return currentMapItem.map(item => {
        return Object.assign({
            item_page_id: item.item_page_id,
            item_data_source_id: item.data_source_id,
            // another_item_id: anotherMapItems ? {
            //     id: anotherMapItems[0].item_page_id,
            //      : null,
        }, contentRec);
    });
}
