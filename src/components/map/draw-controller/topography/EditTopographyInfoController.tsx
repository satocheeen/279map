import { Map } from 'ol';
import { FeatureLike } from 'ol/Feature';
import React, { useCallback, useRef, useState, useContext } from 'react';
import { ListGroup } from 'react-bootstrap';
import { OwnerContext } from '../../../TsunaguMap/TsunaguMap';
import PromptMessageBox from '../PromptMessageBox';
import SelectFeature from '../SelectFeature';

type Props = {
    map: Map;   // コントロール対象の地図
    close: () => void;  // 作図完了時のコールバック
}
enum Stage {
    SELECTING_FEATURE,
    SELECTING_OPERATION,
    SELECTING_CONTENT_KIND,
}
export default function EditTopographyInfoController(props: Props) {
    const [stage, setStage] = useState(Stage.SELECTING_FEATURE);
    const selectedFeatureId = useRef<string>();

    const onSelectFeature = useCallback((feature: FeatureLike) => {
        selectedFeatureId.current = feature.getId() as string;

        setStage(Stage.SELECTING_OPERATION);
    }, []);

    const onClose = useCallback(() => {
        props.close();
    }, [props]);

    const { onNewContentInfo } = useContext(OwnerContext);
    const onContentAdd = useCallback((mode: 'manual' | 'select-unpoint') => {
        if (!selectedFeatureId.current) {
            console.warn('selected feature id undefined.');
            return;
        }
        if (!onNewContentInfo) return;

        onNewContentInfo({
            parent: { itemId: selectedFeatureId.current },
            mode,
        });
        props.close();

    }, [props, onNewContentInfo]);

    switch(stage) {
        case Stage.SELECTING_FEATURE:
            return (
                <SelectFeature
                map={props.map}
                target="topography"
                onOk={onSelectFeature} onCancel={onClose} />
            );
        case Stage.SELECTING_OPERATION:
            return (
                <PromptMessageBox 
                    message="行いたい操作を選択してください" 
                    cancel={onClose}>
                        <ListGroup>
                            {/* <ListGroup.Item action onClick={onInfoEdit}>情報編集</ListGroup.Item> */}
                            <ListGroup.Item action onClick={() => setStage(Stage.SELECTING_CONTENT_KIND)}>コンテンツ追加</ListGroup.Item>
                        </ListGroup>
                </PromptMessageBox>
            );
        case Stage.SELECTING_CONTENT_KIND:
            return (
                <PromptMessageBox 
                    message="追加するコンテンツの種類を選択してください" 
                    cancel={onClose}>
                        <ListGroup>
                            <ListGroup.Item action onClick={()=>onContentAdd('manual')}>新規作成</ListGroup.Item>
                            <ListGroup.Item action onClick={()=>onContentAdd('select-unpoint')}>既存コンテンツ</ListGroup.Item>
                        </ListGroup>
                </PromptMessageBox>
            );
    }
}