// import { getSnsPostGetterByUrl } from "../../279map-backend-common/src/sns";
import { QueryGetSnsPreviewArgs, SnsPreviewResult, SnsType, SnsPreviewPost, MediaType } from "../graphql/__generated__/types";

export async function getSnsPreview(param: QueryGetSnsPreviewArgs): Promise<SnsPreviewResult> {
    throw new Error('未実装');
    // const postGetter = getSnsPostGetterByUrl(param.url);
    // if (!postGetter) {
    //     throw '対応しているURLではありません。';
    // }
    // const posts = await postGetter?.getPosts(3);

    // const resPost = posts.map((post): SnsPreviewPost => {
    //     return {
    //         text: post.text,
    //         date: post.date,
    //         media: post.media ? {
    //             type: (post.media.type === 'IMAGE' ? MediaType.Image : MediaType.Video),
    //             url: post.media.url,
    //         } : undefined,
    //     };
    // });

    // return {
    //     type: SnsType.InstagramUser,
    //     posts: resPost,
    // };
}
