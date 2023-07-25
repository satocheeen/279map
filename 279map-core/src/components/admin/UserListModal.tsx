import React, { useState, useCallback, useMemo } from 'react';
import { useMounted } from '../../util/useMounted';
import { addListener, removeListener } from '../../util/Commander';
import { Modal } from '../common';
import styles from './UserListModal.module.scss';
import { useMap } from '../map/useMap';
import { GetUserListAPI } from 'tsunagumap-api';
import { useWatch } from '../../util/useWatch';
import { Auth, User} from '279map-common';

export default function UserListModal() {
    const [ show, setShow ] = useState(false);
    const [ loading, setLoading ] = useState(false);
    const { getApi } = useMap();
    const [ users, setUsers ] = useState<User[]>([]);

    useMounted(() => {
        const h = addListener('ShowUserList', async() => {
            setShow(true);
        });
        
        return () => {
            removeListener(h);
        }
    });

    useWatch(() => {
        if (!show) return;

        setLoading(true);
        getApi().callApi(GetUserListAPI, undefined)
        .then(result => {
            setUsers(result.users);
        })
        .catch((e) => {
            console.warn(e);
        })
        .finally(() => {
            setLoading(false);
        })

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

function UserRecord(props: { user: User }) {
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

    return (
        <tr>
            <td>{props.user.name}</td>
            <td>{authName}</td>
        </tr>
    )
}