import { ConnectionPool } from "..";
import { CurrentMap } from "../../279map-backend-common/dist";
import { ThumbSize } from "../graphql/__generated__/types";

export async function getImage(imageId: number, size: ThumbSize, currentMap: CurrentMap): Promise <string> {
    const con = await ConnectionPool.getConnection();

    try {
        // ログイン中の地図に属する画像のみ取得できるようにしている（不正取得防止）
        const sql = `
        select ${size === ThumbSize.Thumbnail ? 'thumbnail' : 'medium'} as image from images im
        inner join map_datasource_link mdl on mdl.data_source_id = mdl.data_source_id
        where image_id = ? and map_page_id = ?
        `;
        const [rows] = await con.execute(sql, [imageId, currentMap.mapId]);

        if ((rows as any[]).length === 0) {
            throw 'not found';
        }
        const record = (rows as {image: string}[])[0];
        if (!record.image) {
            throw 'not found';
        }
        return record.image;
        // return 'data:image/jpeg;base64,' + record.thumbnail;

    } finally {
        await con.commit();
        con.release();
    }

}