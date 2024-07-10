import { ConnectionPool, PubSub } from "..";
import { MapKind, MapPageInfoTable } from "../../279map-backend-common/src";
import { getCategory } from "../api/getCategory";
import { CategoryDefine } from "../graphql/__generated__/types";
import { getLogger } from "log4js";

type MapCategories = {
    [MapKind.Real]: CategoryDefine[]; 
    [MapKind.Virtual]: CategoryDefine[]; 
}

const logger = getLogger();

/**
 * 内部的に最新のカテゴリを保持しておき、
 * 変更があった場合に、変更通知を発行するクラス
 */
export class CategoryChecker {
    // 地図のカテゴリ情報
    #categoryMap = new Map<string, MapCategories>();    // key = mapId

    /**
     * 初期化。全地図のカテゴリ情報をメモリに保持する。
     */
    async initialize() {
        logger.info('[start] category checker initialize')
        const mapIdList = await getMapIdList();
        for (const mapId of mapIdList) {
            const mapCategories: MapCategories = {
                Real: [],
                Virtual: [],
            }
            this.#categoryMap.set(mapId, mapCategories);

            for (const mapKind of [MapKind.Real, MapKind.Virtual]) {
                // 最新のカテゴリを取得する
                const categories = await getCategory({}, {
                    mapId,
                    mapKind,
                }) as CategoryDefine[];

                mapCategories[mapKind] = categories;
            }
        }
        logger.info('[end] category checker initialize')
    }

    /**
     * 指定の地図についてカテゴリ変更あるかチェックし、
     * 変更がある場合は、ユーザに更新通知する
     * @param mapId 
     */
    async checkUpdate(mapId: string) {
        if (!this.#categoryMap.has(mapId)) {
            this.#categoryMap.set(mapId, {
                Real: [],
                Virtual: [],
            });
        }
        const lastCategories = this.#categoryMap.get(mapId) as MapCategories;

        for (const mapKind of [MapKind.Real, MapKind.Virtual]) {
            // 最新のカテゴリを取得する
            const categories = await getCategory({}, {
                mapId,
                mapKind,
            }) as CategoryDefine[];

            // 変更があるか
            const isUpdate = function() {
                if (lastCategories) {
                    return !isEqualDefine(categories, lastCategories[mapKind]);
                } else {
                    return categories.length > 0;
                }
            }();

            if (!isUpdate) continue;

            lastCategories[mapKind] = categories;

            // 更新通知
            PubSub.publish('categoryUpdateInTheMap', {
                mapId,
                mapKind,
            }, true);
        }

        

    }
}

async function getMapIdList(): Promise<string[]> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = 'select * from map_page_info';
        const [rows] = await con.execute(sql);

        return (rows as MapPageInfoTable[]).map(rec => rec.map_page_id);

    } finally {
        con.release();
    }
}

function isEqualDefine(a: CategoryDefine[], b: CategoryDefine[]) {
    if (a.length !== b.length) return false;
    return a.every(aItem => {
        const bTarget = b.find(bItem => bItem.datasourceId === aItem.datasourceId && bItem.fieldKey === aItem.fieldKey);
        if (!bTarget) return false;
        const aCategories = aItem.categories.map(c => c.value);
        const bCategories = bTarget.categories.map(c => c.value);

        if (aCategories.length !== bCategories.length) return false;

        return aCategories.every(c => bCategories.includes(c));

    })
}