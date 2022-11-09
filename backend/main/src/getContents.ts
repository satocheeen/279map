import { ContentsDefine, GetContentsParam, GetContentsResult } from "./types/api";
import { APIFunc, ConnectionPool } from '.';
import { ContentsInfo, ContentsTable } from "../../common/src/types/schema";
import { getBelongingItem, getContent } from "./util/utility";
import { MapKind } from "../../common/src/types/common";

type RetRecord = ContentsTable & {item_page_id: string; another_item_id: string|null;};

export const getContents: APIFunc<GetContentsParam, GetContentsResult> = async({ currentMap, param }) => {
    if (!currentMap) {
        throw 'mapKind not defined.';
    }
    const mapKind = currentMap.mapKind;
    const con = await ConnectionPool.getConnection();

    try {
        const allContents = [] as ContentsDefine[];

        const convertRecord = (row: RetRecord): ContentsDefine => {
            const contents = row.contents ? JSON.parse(row.contents) as ContentsInfo: undefined;
            const another_item_ids = row.another_item_id?.split(',') ?? [];
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
                };
        }
        const getChildren = async(contentId: string): Promise<ContentsDefine[]> => {
            const getChildrenQuery = `
            select c.*, i.item_page_id, i.map_kind, group_concat(i2.item_page_id) as another_item_id from contents c 
            left join items i on c.content_page_id = i.content_page_id 
            left join items i2 on c.content_page_id = i2.content_page_id and i2.item_page_id <> i.item_page_id
            group by c.content_page_id, i.item_page_id 
            having c.parent_id = ?
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
                select c.*, i.item_page_id, i.map_kind, group_concat(i2.item_page_id) as another_item_id from contents c 
                inner join items i on c.content_page_id = i.content_page_id 
                left join items i2 on c.content_page_id = i2.content_page_id and i2.item_page_id <> i.item_page_id  
                group by c.content_page_id, i.item_page_id 
                having i.item_page_id = ? and i.map_kind = ?
                `;
                const [rows] = await con.execute(sql, [target.itemId, mapKind]);
                myRows = rows as RetRecord[];
            } else {
                myRows = await getContentInfo(target.contentId, currentMap.mapPageId,currentMap.mapKind);

            }
            if (myRows.length > 0) {
                const content = convertRecord(myRows[0]);
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

async function getContentInfo(content_page_id: string, mapPageId: string, mapKind: MapKind): Promise<RetRecord[]> {
    const contentRec = await getContent(content_page_id);
    if (!contentRec) {
        return [];
    }
    const currentMapItem = await getBelongingItem(contentRec, mapPageId, mapKind);
    if (!currentMapItem) {
        return [];
    }
    const anotherMapKind = mapKind === MapKind.Real ? MapKind.Virtual: MapKind.Real;
    const anotherMapItems = await getBelongingItem(contentRec, mapPageId, anotherMapKind);
    return currentMapItem.map(item => {
        return Object.assign({
            item_page_id: item.item_page_id,
            another_item_id: anotherMapItems ? anotherMapItems[0].item_page_id : null,
        }, contentRec);
    });
}
function convertParentChildStructure(contents: ContentsDefine[]): ContentsDefine[] {
    // IDキーのマップを生成
    const allMap = {} as {[contentId: string]: ContentsDefine};
    contents.forEach(content => {
        allMap[content.id] = content;
    });

    // 親子にする
    contents.forEach(content => {
        if (!content.parentId) {
            // ルートコンテンツの場合は何もしない
            return;
        }
        // 親のchildrenに入る
        if (allMap[content.parentId].children === undefined) {
            allMap[content.parentId].children = [];
        }
        allMap[content.parentId].children?.push(content);
   });

   // 親コンテンツのみを抽出
   return Object.values(allMap).filter(content => !content.parentId);
}