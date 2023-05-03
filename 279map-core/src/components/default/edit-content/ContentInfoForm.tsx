import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { ContentAttr, SnsPreviewPost } from '../../../279map-common';
import SnsPreviewCard from './SnsPreviewCard';
import styles from './ContentInfoForm.module.scss';
import CategorySelector from './CategorySelector';
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import { ImageRegister } from '../../common';
import { GetSnsPreviewResult } from 'tsunagumap-api';
import { useCommand } from '../../../api/useCommand';
dayjs.extend(utc);

type Props = {
    value: ContentAttr;
    getSnsPreviewAPI: (url: string) => Promise<GetSnsPreviewResult>;
    onChange: (value: ContentAttr) => void;
}
export default function ContentInfoForm(props: Props) {
    const [ snsPreviewPosts, setSnsPreviewPosts ] = useState<SnsPreviewPost[]>([]);
    const [ errorMessage, setErrorMessage ] = useState('');

    const handleChange = useCallback((value: string | undefined, propertyName: string) => {
        const newValue = Object.assign({}, props.value, {
            [propertyName]: value,
        });
        if (propertyName === 'url') {
            delete newValue['imageUrl'];
        } else if (propertyName === 'imageUrl') {
            delete newValue['url'];
        }
        if (JSON.stringify(newValue) === JSON.stringify(props.value)) {
            return;
        }
        props.onChange(newValue);

    }, [props]);

    const dateStr = useMemo(() => {
        if (props.value.type !== 'normal') {
            return '';
        }
        if (!props.value.date) {
            return '';
        }
        const offset = dayjs().utcOffset();
        return dayjs.utc(props.value.date).utcOffset(offset).format('YYYY-MM-DD');
    // @ts-ignore
    }, [props.value.type, props.value.date]);

    const onChangeDate = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
        const val = evt.target.value;
        let newDate: string | undefined = undefined;
        if (val.length > 0) {
            const offset = dayjs().utcOffset();
            newDate = dayjs.utc(val).utcOffset(offset).format('YYYY-MM-DD');
        }
        const newValue = Object.assign({}, props.value, {
            date: newDate,
        });
        props.onChange(newValue);
    }, [props]);

    const onRadioClicked = useCallback((contentType: ContentAttr['type']) => {
        const newValue = Object.assign({}, props.value, {
            type: contentType,
        });
        props.onChange(newValue);

    }, [props]);

    const { getSnsPreviewAPI } = useCommand();
    /**
     * SNS投稿プレビュー
     */
    useEffect(() => {
        setSnsPreviewPosts([]);
        setErrorMessage('');
        if (props.value.type !== 'sns' || !props.value.url || props.value.url.length === 0) {
            return;
        }
        getSnsPreviewAPI(props.value.url)
        .then(res => {
            // setSnsPreviewPosts(res.posts);
        })
        .catch((e) => {
            setErrorMessage(''+ e);
        });
    // @ts-ignore
    }, [props.value.type, props.value.url, getSnsPreviewAPI]);

    const onCategoryChanged = useCallback((categories: string[]) => {
        const newValue = Object.assign({}, props.value, {
            categories,
        });
        if (JSON.stringify(newValue) === JSON.stringify(props.value)) {
            return;
        }
        props.onChange(newValue);
    }, [props]);

    return (
        <Form className={styles.Form}>
            <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>タイトル</Form.Label>
                <Col>
                    <Form.Control value={props.value.title} onChange={(e) => handleChange(e.target.value, 'title')} />
                </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>概要</Form.Label>
                <Col>
                    <Form.Control as="textarea" rows={3} value={props.value.overview} onChange={(e) => handleChange(e.target.value, 'overview')} />
                </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>カテゴリ</Form.Label>
                <Col>
                    <CategorySelector selected={props.value.categories} onChange={onCategoryChanged} />
                </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
                <Col>
                    <Form.Check inline type='radio' id="content-type-normal" name="content-type" label="通常" checked={props.value.type === 'normal'} onChange={()=>onRadioClicked('normal')} />
                    <Form.Check inline type='radio' id="content-type-sns" name="content-type" label="SNS連携" checked={props.value.type=== 'sns'} onChange={()=>onRadioClicked('sns')} />
                </Col>
            </Form.Group>
            {props.value.type === 'normal' ?
                <>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm={3}>画像</Form.Label>
                        <Col>
                            <ImageRegister imageUrl={props.value.imageUrl} onSelect={(evt) => handleChange(evt.imageUrl, 'imageUrl')} />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm={3}>日付</Form.Label>
                        <Col>
                            <Form.Control type='date' value={dateStr} onChange={onChangeDate} />
                        </Col>
                    </Form.Group>
                </>
                :
                <>
                    <div>
                        <p>SNS投稿を自動連携して表示します。</p>
                        <ul>
                            <li>現在対応しているURL</li>
                            <ul>
                                <li>
                                    インスタグラム ビジネスユーザーページ (https://www.instagram.com/ユーザ名/)<br/>
                                </li>
                            </ul>
                        </ul>
                    </div>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm={3}>URL</Form.Label>
                        <Col>
                            <Form.Control value={props.value.url ?? ''} placeholder="" onChange={(e) => handleChange(e.target.value, 'url')} />
                            <p className="text-danger">{errorMessage}</p>
                        </Col>
                    </Form.Group>
                    <div className={styles.PreviewArea}>
                    {
                        snsPreviewPosts.length > 0 &&
                        <div>
                            <p className={styles.SubTitle}>プレビュー</p>
                            {
                                snsPreviewPosts.map((post, index) => {
                                    return (
                                        <SnsPreviewCard key={index} post={post} />
                                    )
                                })
                            }
                        </div>
                    }
                    </div>
                </>
        }
        </Form>
);
}