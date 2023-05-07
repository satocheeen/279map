import { ConnectionPool } from '.';
import { CurrentMap, schema, DataId, sns } from "279map-backend-common";
import { getAncestorItemId, getContent } from "./util/utility";
import { GetContentsParam, GetContentsResult } from '../279map-api-interface/src';
import { ContentsDefine } from '279map-backend-common';
import mysql from 'mysql2/promise';

export async function getContents({ param, currentMap }: {param: GetContentsParam; currentMap: CurrentMap}): Promise<GetContentsResult> {
    if (!currentMap) {
        throw 'mapKind not defined.';
    }
    const mapKind = currentMap.mapKind;
    const con = await ConnectionPool.getConnection();

    try {
        const allContents = [] as ContentsDefine[];

        const convertRecord = async(row: schema.ContentsTable, itemId: DataId): Promise<ContentsDefine> => {
            const contents = row.contents ? JSON.parse(row.contents) as schema.ContentsInfo: undefined;
            let isSnsContent = false;
            let addableChild = true;
            if (row.supplement) {
                isSnsContent = true;
                addableChild = false;
            }
            return {
                id: {
                    id: row.content_page_id,
                    dataSourceId: row.data_source_id,
                },
                itemId,
                title: row.title ?? '',
                date: row.date,
                category: row.category ? JSON.parse(row.category) : [],
                image: row.thumbnail ? true : undefined,
                videoUrl: contents?.videoUrl,
                overview: contents?.content,
                url: contents?.url,
                parentId: (row.parent_id && row.parent_datasource_id) ? {
                    id: row.parent_id,
                    dataSourceId: row.parent_datasource_id,
                } : undefined,
                anotherMapItemId: undefined,// TODO:  // 複数存在する場合は１つだけ返す
                isSnsContent,
                addableChild,
                readonly: row.readonly ? true : false,
            };
        }
        const getChildren = async(contentId: DataId, itemId: DataId): Promise<ContentsDefine[]> => {
            const getChildrenQuery = `
                select c.* from contents c
                where c.parent_id = ? AND c.parent_datasource_id = ?
                `;
            const [rows] = await con.execute(getChildrenQuery, [contentId.id, contentId.dataSourceId]);
            const children = [] as ContentsDefine[];
            for (const row of rows as schema.ContentsTable[]) {
                const content = await convertRecord(row, itemId);
                content.children = await getChildren(content.id, itemId);
                children.push(content);
            }
            return children;
        }
        for (const target of param) {
            let myRows: schema.ContentsTable[];
            let itemId: DataId;
            if ('itemId' in target) {
                itemId = target.itemId;
                const sql = `
                select c.*, i.item_page_id, i.data_source_id as item_data_source_id, i.map_kind from contents c
                inner join item_content_link icl on icl.content_page_id = c.content_page_id 
                inner join items i on i.item_page_id = icl.item_page_id 
                inner join data_source ds on ds.data_source_id = i.data_source_id
                group by c.content_page_id, c.data_source_id, i.item_page_id, i.data_source_id
                having i.item_page_id = ? and i.data_source_id = ? and i.map_kind = ?
                `;
                const query = mysql.format(sql, [target.itemId.id, target.itemId.dataSourceId, mapKind]);
                const [rows] = await con.execute(query);
                myRows = rows as schema.ContentsTable[];
            } else {
                // 先祖ItemIdを取得
                const myItemId = await getAncestorItemId(con, target.contentId, currentMap);
                if (!myItemId) {
                    throw new Error('item not found.');
                }
                itemId = myItemId;
                const contentRecord = await getContent(target.contentId);
                myRows = contentRecord ? [contentRecord] : [];
            }

            for (const row of myRows) {
                const content = await convertRecord(row, itemId);
                // 子孫コンテンツを取得
                content.children = await getChildren(content.id, itemId);
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
