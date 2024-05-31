import { ConnectionPool } from "../..";
import { ContentsTable, DataId, DataSourceTable, MapDataSourceLinkTable } from "../../../279map-backend-common/dist";
import { Auth, CurrentMap } from "../../../279map-backend-common/src";
import { convertContentsToContentsDefine } from "../../api-common/convertContent";
import { ContentsDefine } from "../../graphql/__generated__/types";

type Param = {
    dataId: DataId;
    currentMap: CurrentMap;
    authLv: Auth;
}

/**
 * 指定のdataIdに紐づくコンテンツを返す
 * @param dataId 基点となるdataId
 * @param mapId 接続中の地図ID。この地図で使われていないコンテンツは返さない。
 * @param authLv ユーザ認証レベル。この値を加味して、コンテンツのeditable等を設定して返す。
 * @return 指定のdataIdに紐づくコンテンツ一覧。指定のdataId自体のコンテンツは含まない。
 */
export async function getLinkedContent({ dataId, currentMap, authLv }: Param): Promise<ContentsDefine[]> {
    const con = await ConnectionPool.getConnection();

    try {
        // 指定のdataIdから参照されているコンテンツを取得
        const sql = `
        select * from datas d 
        inner join contents c on c.data_id = d.data_id 
        inner join data_source ds on ds.data_source_id = d.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
        where mdl.map_page_id = ? and EXISTS (
            select * from data_link dl
            where dl.to_data_id = d.data_id and from_data_id = ?
        )
        `;

        const [rows] = await con.query(sql, [currentMap.mapId, dataId]);

        const contents = await Promise.all((rows as (ContentsTable & DataSourceTable & MapDataSourceLinkTable)[]).map(async(record) => {
            return convertContentsToContentsDefine(con, record, currentMap, authLv);
        }));

        return contents;

    } finally {
        con.release();
    }
}