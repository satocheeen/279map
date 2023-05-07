import { ConnectionPool } from '.';
import { CurrentMap, schema, DataId } from "279map-backend-common";
import { getAncestorItemId } from "./util/utility";
import { GetContentsParam, GetContentsResult } from '../279map-api-interface/src';
import { ContentsDefine } from '279map-backend-common';

type ContentsDatasourceRecord = schema.ContentsTable & schema.DataSourceTable;

export async function getContents({ param, currentMap }: {param: GetContentsParam; currentMap: CurrentMap}): Promise<GetContentsResult> {
    if (!currentMap) {
        throw 'mapKind not defined.';
    }
    const mapKind = currentMap.mapKind;
    const con = await ConnectionPool.getConnection();

    try {
        const allContents = [] as ContentsDefine[];

        const convertRecord = async(row: ContentsDatasourceRecord, itemId: DataId): Promise<ContentsDefine> => {
            const contents = row.contents ? JSON.parse(row.contents) as schema.ContentsInfo: undefined;
            let isSnsContent = false;
            let addableChild = true;
            let readonly = row.readonly;
            if (row.supplement) {
                // SNSコンテンツの場合
                isSnsContent = true;
                addableChild = false;
            }
            const myDatasourceKind = (row.kinds as schema.DataSourceKind[]).find(kind => kind.type === schema.DataSourceKindType.Content);
            if (!myDatasourceKind?.editable) {
                // データソースが編集不可の場合
                readonly = true;
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
                readonly,
            };
        }
        const getChildren = async(contentId: DataId, itemId: DataId): Promise<ContentsDefine[]> => {
            const getChildrenQuery = `
                select c.*, ds.* from contents c
                inner join data_source ds on ds.data_source_id = c.data_source_id
                where c.parent_id = ? AND c.parent_datasource_id = ?
                `;
            const [rows] = await con.execute(getChildrenQuery, [contentId.id, contentId.dataSourceId]);
            const children = [] as ContentsDefine[];
            for (const row of rows as ContentsDatasourceRecord[]) {
                const content = await convertRecord(row, itemId);
                content.children = await getChildren(content.id, itemId);
                children.push(content);
            }
            return children;
        }
        for (const target of param) {
            let myRows: ContentsDatasourceRecord[];
            let itemId: DataId;
            if ('itemId' in target) {
                itemId = target.itemId;
                // itemの子コンテンツを取得

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
            } else {
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
