import { getLogger } from "log4js";
import { ConnectionPool } from "..";
import { SnsOptions, getSnsPostGetter } from "../../279map-backend-common/src/sns";
import { ContentsTable } from "../../279map-backend-common/src/types/schema";
import { getImageBase64 } from "../../279map-backend-common/src";

const logger = getLogger();

/**
 * SNS投稿コンテンツについて、最新投稿を取得してキャッシュDBを更新する。
 * @param mapPageId 
 * @param content_id 指定している場合、このコンテンツに限定して更新。
 */
export async function updateSnsContents(mapPageId: string, content_id?: string) {
    logger.info('[start]updateSnsContents', mapPageId);
    const con = await ConnectionPool.getConnection();

    try {
        // カテゴリ抽出
        const categorySql = `
            select c.category from contents c 
            inner join data_source ds on ds.data_source_id = c.data_source_id
            where map_page_id = ? and c.supplement is NULL and category is not NULL and category <> '[]'
        `;
        const [categoryRows] = await con.execute(categorySql, [mapPageId]);
        const categorySet = new Set<string>();
        for(const row of (categoryRows as {category: string}[])) {
            const categories = JSON.parse(row.category) as string[];
            categories.forEach(category => {
                categorySet.add(category);
            });
        }

        type Record = {content_page_id: string; supplement: string; data_source_id: string};
        let rows: Record[];
        if (content_id) {
            const sql = `
                SELECT c.content_page_id, c.supplement, c.data_source_id from contents c
                WHERE content_page_id = ? and c.supplement is not NULL
                `;
            const [result] = await con.execute(sql, [content_id]);
            rows = result as Record[];

        } else {
            const sql = `
                SELECT distinct c.content_page_id, c.supplement, c.data_source_id from contents c
                WHERE contents_db_id = ? and c.supplement is not NULL
                `;
            const [result] = await con.execute(sql, [mapPageId]);
            rows = result as Record[];
        }
        for(const row of rows) {
            const itemProperties = JSON.parse(row.supplement) as SnsOptions;
            const snsPostGetter = getSnsPostGetter(itemProperties);
            if (!snsPostGetter) {
                // logger.warn('不正なSNSオプション', itemProperties);
                continue;
            }
            // SNS投稿を取得して、コンテンツDBに格納
            // -- 現在のコンテンツDBをクリア
            const delSql = `
                DELETE from contents
                WHERE parent_id = ?
                `;
            await con.query(delSql, [row.content_page_id]);

            // -- SNS投稿を取得
            const posts = await snsPostGetter.getPosts(3);
            for (const post of posts) {
                try {
                    let thumbnail: undefined | string;
                    if (post.media?.type === 'IMAGE') {
                        const imageInfo = await getImageBase64(post.media.url, {
                            size: { width: 300, height: 300 },
                        });
                        thumbnail = imageInfo?.base64;
                    }
                    let index = post.text.indexOf('\n');
                    if (index > 20) {
                        index = 20;
                    }

                    // タイトル（冒頭行 or 冒頭20文字）
                    let title: string;
                    const contents = {} as any;
                    if (index !== -1) {
                        title = post.text.substring(0, index);
                        contents.content = post.text.substring(index + 1);
                    } else {
                        title = post.text;
                    }
                    contents.url = post.url;
                    contents.videoUrl = post.media?.type === 'VIDEO' ? post.media.url : undefined;

                    // カテゴリ
                    const categories = post.hashtags.filter(tag => {
                        return categorySet.has(tag);
                    });
                    const contentValue = {
                        content_page_id: 'IG:' + row.content_page_id + post.id,
                        data_source_id: row.data_source_id,
                        title,
                        contents: JSON.stringify(contents),
                        thumbnail,
                        category: JSON.stringify(categories),
                        date: new Date(post.date),
                        parent_id: row.content_page_id,
                        supplement: JSON.stringify({type: 'SnsContent'}),
                        last_edited_time: post.date,
                    } as ContentsTable;
                    const sql2 = 'INSERT INTO contents SET ?';
                    await con.query(sql2, [contentValue]);

                } catch(e) {
                    logger.warn('Insert INSTAGRAM Contents Error.', e, post);
                }
            }
        }
    } catch(e) {
        logger.warn('Insert INSTAGRAM Error.', e);
        await con.rollback();

    } finally {
        await con.commit();
        con.release();
        logger.info('[end]updateSnsContents', mapPageId);
    }

}

