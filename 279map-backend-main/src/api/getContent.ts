import { ConnectionPool } from "..";
import { Auth, ContentsTable, CurrentMap, DataSourceTable, MapDataSourceLinkTable } from "../../279map-backend-common/src";
import { convertContentsToContentsDefine } from "../api-common/convertContent";
import { ContentsDefine } from "../graphql/__generated__/types";
import { DataId } from "../types-common/common-types";

type Param = {
    dataId: DataId;
    currentMap: CurrentMap;
    authLv: Auth;
}

/**
 * 指定のコンテンツについて情報を取得して返す
 * @param dataId 取得対象コンテンツ
 * @param currentMap 接続中の地図。この地図で使われていないコンテンツの場合は、値を返さない。
 * @param authLv ユーザ認証レベル。この値を加味して、コンテンツのeditable等を設定して返す。
 */
export async function getContent({ dataId, currentMap, authLv }: Param): Promise<ContentsDefine | null> {
    const con = await ConnectionPool.getConnection();

    try {
        // 指定のdataIdに紐づくコンテンツを取得
        const sql = `
        select * from datas d 
        inner join contents c on c.data_id = d.data_id 
        inner join data_source ds on ds.data_source_id = d.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
        where mdl.map_page_id = ? and d.data_id = ?
        `;

        const [rows] = await con.query(sql, [currentMap.mapId, dataId]);
        if ((rows as []).length === 0) {
            return null;
        }
        const record = (rows as (ContentsTable & DataSourceTable & MapDataSourceLinkTable)[])[0];
        const content = await convertContentsToContentsDefine(record, currentMap, authLv);

        return content;

    } finally {
        con.release();
    }
}