import { UnpointContent } from '279map-common';
import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import styles from './NotionContentCard.module.scss';

type Props = {
    content: UnpointContent;
}

export default function NotionContentCard(props: Props) {
    const imgSrc = useMemo(() => {
        if (!props.content.thumb) {
            return undefined;
        }
        return 'data:image/' + props.content.thumb;
    }, [props.content]);

    const title = useMemo(() => {
        if (props.content.title.length === 0) {
            return '（名称なし）';
        } else {
            return props.content.title;
        }
    }, [props.content]);

    return (
        <Card className={styles.Card}>
            {imgSrc ?
                <Card.Img variant="top" src={imgSrc} />
                :
                <Card.Img variant="top" as='div' className={styles.NoImg} />
            }
            <Card.Body>
                <Card.Title>{title}</Card.Title>
                <Card.Text>{props.content.overview}</Card.Text>
            </Card.Body>
        </Card>
    );
}