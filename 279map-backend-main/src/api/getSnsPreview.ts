import { getSnsPostGetterByUrl } from "../../279map-backend-common/src/sns";
import { GetSnsPreviewParam, GetSnsPreviewResult } from "../../279map-api-interface/src";
import { SnsPreviewPost } from '279map-common';

export async function getSnsPreview(param: GetSnsPreviewParam): Promise<GetSnsPreviewResult> {
    const postGetter = getSnsPostGetterByUrl(param.url);
    if (!postGetter) {
        throw '対応しているURLではありません。';
    }
    const posts = await postGetter?.getPosts(3);

    const resPost = posts.map((post): SnsPreviewPost => {
        return {
            text: post.text,
            date: post.date,
            media: post.media,
        };
    });

    return {
        type: postGetter.type,
        posts: resPost,
    };
}
