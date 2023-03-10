import { ConnectionPool } from '.';
import { types } from "279map-backend-common";
import { getBelongingItem, getContent } from "./util/utility";
import { PoolConnection } from "mysql2/promise";
import { GetContentsParam, GetContentsResult } from '../279map-api-interface/src';
import { ContentsDefine, MapKind } from '279map-backend-common';

type RetRecord = types.schema.ContentsTable & {item_page_id: string; /*another_item_id: string|null;*/};

export async function getContents({ param, currentMap }: {param: GetContentsParam; currentMap: types.CurrentMap}): Promise<GetContentsResult> {
    if (!currentMap) {
        throw 'mapKind not defined.';
    }
    const mapKind = currentMap.mapKind;
    const con = await ConnectionPool.getConnection();

    try {
        const allContents = [] as ContentsDefine[];

        const convertRecord = (row: RetRecord): ContentsDefine => {
            const contents = row.contents ? JSON.parse(row.contents) as types.schema.ContentsInfo: undefined;
            const another_item_ids = [] as string[];    //TODO: row.another_item_id?.split(',') ?? [];
            let isSnsContent = false;
            let addableChild = true;
            if (row.supplement) {
                const supplement = JSON.parse(row.supplement);
                isSnsContent = supplement.type === 'SnsContent';
                addableChild = false;
            }
            return {
                    id: row.content_page_id,
                    itemId: row.item_page_id,
                    title: row.title ?? '',
                    date: row.date,
                    category: row.category ? JSON.parse(row.category) : [],
                    image: row.thumbnail ? true : undefined,
                    videoUrl: contents?.videoUrl,
                    overview: contents?.content,
                    url: contents?.url,
                    parentId: row.parent_id,
                    anotherMapItemId: another_item_ids.length === 0 ? undefined : another_item_ids[0],  // 複数存在する場合は１つだけ返す
                    isSnsContent,
                    addableChild,
                    readonly: row.readonly ? true : false,
                };
        }
        const getChildren = async(contentId: string): Promise<ContentsDefine[]> => {
            const getChildrenQuery = `
                select c.*, i.item_page_id from contents c
                inner join item_content_link icl on icl.content_page_id = c.content_page_id 
                inner join items i on i.item_page_id = icl.item_page_id 
                where c.parent_id = ?
                `;
            const [rows] = await con.execute(getChildrenQuery, [contentId]);
            const children = [] as ContentsDefine[];
            for (const row of rows as RetRecord[]) {
                const content = convertRecord(row);
                content.children = await getChildren(content.id);
                children.push(content);
            }
            return children;
        }
        for (const target of param) {
            let myRows: RetRecord[];
            if ('itemId' in target) {
                const sql = `
                select c.*, i.item_page_id, ig.map_kind from contents c
                inner join item_content_link icl on icl.content_page_id = c.content_page_id 
                inner join items i on i.item_page_id = icl.item_page_id 
                inner join item_group ig on ig.item_group_id = i.item_group_id
                group by c.content_page_id, i.item_page_id 
                having i.item_page_id = ? and ig.map_kind = ?
                `;
                const [rows] = await con.execute(sql, [target.itemId, mapKind]);
                myRows = rows as RetRecord[];
            } else {
                myRows = await getContentInfo(con, target.contentId, currentMap.mapId,currentMap.mapKind);

            }
            for (const row of myRows) {
                const content = convertRecord(row);
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
    const anotherMapItems = await getBelongingItem(con, contentRec, mapPageId, anotherMapKind);
    return currentMapItem.map(item => {
        return Object.assign({
            item_page_id: item.item_page_id,
            another_item_id: anotherMapItems ? anotherMapItems[0].item_page_id : null,
        }, contentRec);
    });
}
