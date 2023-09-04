import React, { useState, useCallback, useMemo } from 'react';
import { useMounted } from '../../util/useMounted';
import { addListener, removeListener } from '../../util/Commander';
import { Button, Modal } from '../common';
import styles from './UserListModal.module.scss';
import { ChangeAuthLevelAPI, GetUserListAPI } from 'tsunagumap-api';
import { useWatch } from '../../util/useWatch';
import { Auth, User} from '279map-common';
import Select from '../common/form/Select';
import { useSubscribe } from '../../api/useSubscribe';
import { useApi } from '../../api/useApi';

export default function UserListModal() {
    const [ show, setShow ] = useState(false);
    const [ loading, setLoading ] = useState(false);
    const { callApi } = useApi();
    const [ users, setUsers ] = useState<User[]>([]);

    useMounted(() => {
        const h = addListener('ShowUserList', async() => {
            setShow(true);
        });
        
        return () => {
            removeListener(h);
        }
    });

    const loadUsers = useCallback(() => {
        setLoading(true);
        callApi(GetUserListAPI, undefined)
        .then(result => {
            setUsers(result.users);
        })
        .catch((e) => {
            console.warn(e);
        })
        .finally(() => {
            setLoading(false);
        })
    }, [callApi]);
    
    const { subscribeMap: subscribe, unsubscribeMap: unsubscribe } = useSubscribe();
    useWatch(() => {
        if (!show) return;

        loadUsers();
        subscribe('userlist-update', undefined, undefined, loadUsers);

        return () => {
            unsubscribe('userlist-update', undefined, undefined);
        }
    }, [show])

    const onCloseBtnClicked = useCallback(() => {
        setShow(false);
    }, [])

    const onClosed = useCallback(() => {

    }, []);

    return (
        <Modal show={show} spinner={loading}
            onCloseBtnClicked={onCloseBtnClicked}
            onClosed={onClosed}
            >
            <Modal.Header>
                ユーザ一覧
            </Modal.Header>
            <Modal.Body>
                <UserList users={users} setLoading={setLoading} />
            </Modal.Body>
            <Modal.Footer>

            </Modal.Footer>
        </Modal>
    );
}

type UserListProp = {
    users: User[];
    setLoading: (val: boolean) => void;
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
                    return <UserRecord key={user.id} user={user} setLoading={props.setLoading} />
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
    setLoading: (val: boolean) => void;
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

    const onUpdateAuth = useCallback(async() => {
        if (!requestAuth) return;
        props.setLoading(true);
        await callApi(ChangeAuthLevelAPI, {
            userId: props.user.id,
            authLv: requestAuth,
        })
        props.setLoading(false);
        setStage('normal');
    }, [callApi, requestAuth, props]);

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