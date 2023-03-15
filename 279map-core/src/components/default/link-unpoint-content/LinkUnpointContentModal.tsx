import React, { useCallback, useEffect, useState } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from '../../common';
import { LinkUnpointContentParam } from '../../../types/types';
import { UnpointContent } from '../../../279map-common';

type Props = {
    param: LinkUnpointContentParam;
    close?: () => void;
}

/**
 * 既存コンテンツをアイテムに紐づけるダイアログ（デフォルト版）
 * @param props 
 * @returns 
 */
export default function LinkUnpointContentModal(props: Props) {
    const [ unpointContents, setUnpointContents ] = useState<UnpointContent[]>([]);
    const [ nextToken, setNextToken ] = useState<string|undefined>();

    useEffect(() => {
        props.param.getUnpointDataAPI()
        .then((result) => {
            setUnpointContents(result.contents);
            setNextToken(result.nextToken);
        })
    }, [props.param]);

    const onSelect = useCallback(async(id: string) => {
        await props.param.linkContentToItemAPI({
            parent: props.param.parent,
            childContentId: id,
        });
        if (props.close) {
            props.close();
        }
    }, [props]);

    const onCancel = useCallback(() => {
        if (props.close) {
            props.close();
        }
    }, [props]);

    return (
        <Modal show={true}>
            <ModalHeader>
                既存コンテンツを選択
            </ModalHeader>
            <ModalBody>
                <div>
                    <ul>
                        {unpointContents.map((uc) => {
                            return (
                                <li key={uc.id} onClick={()=>onSelect(uc.id)}>
                                    {uc.title}
                                </li>
                            ) 
                        })}
                    </ul>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
            </ModalFooter>
        </Modal>
    );
}