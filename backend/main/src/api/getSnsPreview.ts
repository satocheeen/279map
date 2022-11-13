import { APIFunc } from "..";
import { getSnsPostGetterByUrl } from "279map-common/dist/sns/SnsPostGetter";
import { GetSnsPreviewParam, GetSnsPreviewResult, SnsPreviewPost } from "../types/api";

export const getSnsPreview: APIFunc<GetSnsPreviewParam, GetSnsPreviewResult> = async({ param }) => {
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
