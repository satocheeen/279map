import React, { useState, useCallback, useMemo } from 'react';
import { Button, Modal } from '../../common';
import styles from './DefaultUserListModal.module.scss';
import { ChangeAuthLevelAPI } from 'tsunagumap-api';
import { useWatch } from '../../../util/useWatch';
import { Auth } from '279map-common';
import Select from '../../common/form/Select';
import { useSubscribe } from '../../../api/useSubscribe';
import { useApi } from '../../../api/useApi';
import { modalSpinnerAtom } from '../../common/modal/Modal';
import { useAtomCallback } from 'jotai/utils';
import { useAtom } from 'jotai';
import { clientAtom } from 'jotai-urql';
import { GetUserListDocument, User } from '../../../graphql/generated/graphql';

type Props = {
    onClose: () => void;
}
export default function DefaultUserListModal(props: Props) {
    const [ show, setShow ] = useState(true);
    const [ users, setUsers ] = useState<User[]>([]);
    const [ gqlClient ] = useAtom(clientAtom);

    const loadUsers = useAtomCallback(
        useCallback(async (get, set) => {
            set(modalSpinnerAtom, true);
            const result = await gqlClient.query(GetUserListDocument, {});
            const users = result.data?.getUserList ?? [];
            setUsers(users);
            set(modalSpinnerAtom, false);
        }, [gqlClient])
    )
    
    const { getSubscriber } = useSubscribe();
    useWatch(() => {
        if (!show) return;

        loadUsers();
        const subscriber = getSubscriber();
        const h = subscriber?.subscribeMap({}, 'userlist-update', undefined, loadUsers);

        return () => {
            if (h)
                subscriber?.unsubscribe(h);
        }
    }, [show])

    const onCloseBtnClicked = useCallback(() => {
        setShow(false);
    }, [])

    const onClosed = useCallback(() => {
        props.onClose();
    }, [props]);

    return (
        <Modal show={show}
            onCloseBtnClicked={onCloseBtnClicked}
            onClosed={onClosed}
            >
            <Modal.Header>
                ユーザ一覧
            </Modal.Header>
            <Modal.Body>
                <UserList users={users} />
            </Modal.Body>
            <Modal.Footer>

            </Modal.Footer>
        </Modal>
    );
}

type UserListProp = {
    users: User[];
}
function UserList(props: UserListProp) {
    return (
        <table className={styles.UserList}>
            <thead>
                <tr>
                    <th>ユーザ名</th>
                    <th>権限</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {props.users.map(user => {
                    return <UserRecord key={user.id} user={user} />
                })}
            </tbody>
        </table>
    )
}

const authSelectItems = [
    { value: Auth.View, name: '閲覧者' },
    { value: Auth.Edit, name: '編集者' },
    { value: Auth.Admin, name: '管理者' },
]

type UserRecordProp = {
    user: User;
}
function UserRecord(props: UserRecordProp) {
    const [ requestAuth, setRequestAuth ] = useState<Auth|undefined>();
    const { callApi } = useApi();
    const [ stage, setStage ] = useState<'normal' | 'selectAuth'>('normal');

    const authName = useMemo(() => {
        switch(props.user.authLv) {
            case Auth.Admin:
                return '管理者';
            case Auth.Request:
                return '承認待ち';
            case Auth.Edit:
                return '編集者';
            case Auth.View:
                return '閲覧者';
            default:
                return '';
        }
    }, [props.user]);

    const onUpdateAuth = useAtomCallback(
        useCallback(async(get, set) => {
            if (!requestAuth) return;
            set(modalSpinnerAtom, true);
            await callApi(ChangeAuthLevelAPI, {
                userId: props.user.id,
                authLv: requestAuth,
            })
            set(modalSpinnerAtom, false);
            setStage('normal');
        }, [callApi, requestAuth, props])
    )

    console.log('requestAuth', requestAuth);
    const action = useMemo(() => {
        if (props.user.authLv === Auth.Request) {
            return (
                <>
                    <Select items={authSelectItems} value={requestAuth} onSelect={(value)=>setRequestAuth(value as Auth)} />
                    <Button variant='secondary' onClick={onUpdateAuth}>承認</Button>
                </>
            )
        }
        if (stage === 'normal') {
            return (
                <Button variant='secondary' onClick={() => {
                    setRequestAuth(props.user.authLv);
                    setStage('selectAuth');
                }}>権限変更</Button>
            )
        } else {
            return (
                <>
                    <Select items={authSelectItems} value={requestAuth} onSelect={(value)=>setRequestAuth(value as Auth)} />
                    <Button variant='secondary' onClick={onUpdateAuth}>更新</Button>
                    <Button variant='secondary' onClick={()=>setStage('normal')}>Cancel</Button>
                </>
            )
        }
    }, [props.user.authLv, stage, onUpdateAuth, requestAuth]);

    return (
        <tr>
            <td>{props.user.name}</td>
            <td>{authName}</td>
            <td>{action}</td>
        </tr>
    )
}