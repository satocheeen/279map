import { APIFunc } from "..";
import { getSnsPostGetterByUrl } from "279map-backend-common/dist/sns/SnsPostGetter";
import { api } from "279map-common";

export const getSnsPreview: APIFunc<api.GetSnsPreviewParam, api.GetSnsPreviewResult> = async({ param }) => {
    const postGetter = getSnsPostGetterByUrl(param.url);
    if (!postGetter) {
        throw '対応しているURLではありません。';
    }
    const posts = await postGetter?.getPosts(3);

    const resPost = posts.map((post): api.SnsPreviewPost => {
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
