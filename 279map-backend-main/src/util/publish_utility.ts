import { ConnectionPool } from "..";
import { DataId } from "../../279map-backend-common/dist";
import { DatasTable } from "../../279map-backend-common/src";
import MyPubSub from "../graphql/MyPubSub";
import { Operation, Target } from "../graphql/__generated__/types";
import { DatasourceLocationKindType, MapKind } from "../types-common/common-types";

export async function publishData(pubsub: MyPubSub, operation: 'insert' | 'update',  targets: DataId[]) {
    // 変更対象を取得する
    const allTargets: (Target & { mapId: string; mapKind: MapKind })[] = [];
    for (const id of targets) {
        const datas = await getData(id);
        for (const data of datas) {
            const wkt = data.hasItem ? await getItemWkt(data.data_id) : undefined;
            allTargets.push({
                mapId: data.map_page_id,
                mapKind: data.mapKind,
                id,
                datasourceId: data.data_source_id,
                hasItem: data.hasItem,
                hasContent: data.hasContents,
                wkt,
            });
        }
    }

    const mapIdList = allTargets.reduce((acc, cur) => {
        if (acc.includes(cur.mapId)) return acc;
        return [...acc, cur.mapId]
    }, [] as string[]);

    for (const mapId of mapIdList) {
        for (const mapKind of [MapKind.Real, MapKind.Virtual]) {
            const targets = allTargets.filter(at => at.mapId === mapId && at.mapKind === mapKind);
            if (targets.length > 0) {
                switch(operation) {
                    case 'insert':
                        pubsub.publish('dataInsertInTheMap', {
                            mapId,
                            mapKind,
                        }, targets);
                        break;
                    case 'update':
                        pubsub.publish('dataUpdateInTheMap', {
                            mapId,
                            mapKind,
                        }, targets);
                        targets.forEach(target => {
                            pubsub.publish('dataUpdate', {
                                id: target.id,
                            }, Operation.Update);
                        })
                }
            }
        }
    }

}

type GetDataResult = DatasTable & {
    map_page_id: string;
    mapKind: MapKind;
    hasContents: boolean;
    hasItem: boolean;
}

/**
 * 指定のidに紐づく情報を返す。
 * @param id 
 * @returns 複数の地図に紐づく場合を考慮して、一覧で返す。
 */
async function getData(id: DataId): Promise<GetDataResult[]> {
    const con = await ConnectionPool.getConnection();
    try {
        const sql = `
        select d.*, mdl.map_page_id, ds.location_kind, count(c.data_id) as contents_num, COUNT(gi.data_id) as items_num  from datas d 
        inner join data_source ds on ds.data_source_id = d.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
        left join contents c on c.data_id = d.data_id 
        left join geometry_items gi on gi.data_id = d.data_id 
        group by d.data_id, mdl.map_page_id 
        having d.data_id = ?
        `;
        const [rows] = await con.query(sql, [id]);

        const records = rows as (DatasTable & { map_page_id: string; location_kind: DatasourceLocationKindType; contents_num: number; items_num: number })[];

        return records.map(rec => {
            return Object.assign({}, rec, {
                mapKind: [DatasourceLocationKindType.RealItem, DatasourceLocationKindType.Track].includes(rec.location_kind) ? MapKind.Real : MapKind.Virtual,
                hasContents: rec.contents_num > 0,
                hasItem: rec.items_num > 0,
            })
        })

    } catch(e) {
        throw new Error('getData error.' + e);

    } finally {
        await con.rollback();
        con.release();
    }
}

/**
 * 指定のアイテムのwktを返す
 * @param itemId 
 * @returns 
 */
async function getItemWkt(itemId: DataId): Promise<string|undefined> {
    const con = await ConnectionPool.getConnection();

    // TODO: 複数ヒットするケース（Track）の考慮
    try {
        const sql = `
        SELECT ST_AsText(ST_Envelope(feature)) as location
        from geometry_items gi 
        where data_id = ?
        `;
        const [rows] = await con.execute(sql, [itemId]);
        if ((rows as []).length === 0) {
            return;
        }
        const location = (rows as {location: string}[])[0].location;
        return location;
    
    } finally {
        await con.rollback();
        con.release();
    }

}