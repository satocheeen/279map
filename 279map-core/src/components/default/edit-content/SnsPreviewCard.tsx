import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import styles from './SnsPreviewCard.module.scss';
import { MediaType, SnsPreviewPost } from '../../../graphql/generated/graphql';

type Props = {
    post: SnsPreviewPost;
}

export default function SnsPreviewCard(props: Props) {
    const imageUrl = useMemo(() => {
        if (props.post.media?.type === MediaType.Image) {
            return props.post.media.url;
        } else {
            return null;
        }
    }, [props.post.media]);

    const videoUrl = useMemo(() => {
        if (props.post.media?.type === MediaType.Video) {
            return props.post.media.url;
        } else {
            return null;
        }
    }, [props.post.media]);

    const dateStr = useMemo(() => {
        if (!props.post.date) {
            return null;
        }
        return dayjs(props.post.date).format('YYYY/MM/DD HH:mm');
    }, [props.post.date]);

    return (
        <div className={styles.Card}>
            <div className={styles.ImageContainer}>
                {imageUrl &&
                    <img className={styles.Image} src={imageUrl} alt="contents" />
                }
                {videoUrl &&
                        <video className={styles.Video} src={videoUrl} controls playsInline />
                }
            </div>
            <div className={styles.TextContainer}>
                <p className={styles.Date}>{dateStr}</p>
                <p>
                    {props.post.text}
                </p>
            </div>
        </div>
    );
}