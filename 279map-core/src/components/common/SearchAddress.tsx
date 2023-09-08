import { GeoJsonObject, Point } from 'geojson';
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Input from '../common/form/Input';
import { FeatureType, GeoProperties } from '279map-common';
import Spinner from './spinner/Spinner';
import { GeocoderAPI, GeocoderItem } from 'tsunagumap-api';
import ListGroup from './list/ListGroup';
import { useApi } from '../../api/useApi';

type Props = {
    disabled?: boolean; // trueの場合、住所入力不可
    defaultAddress?: string;
    onAddress?: (geoJson: GeoJsonObject) => void;
    searchTarget: ('point' | 'area')[];
}

export interface SearchAddressHandler {
    clear(): void;
    setAddress(address: string): void;
}
/**
 * 住所 または 緯度経度 からGeoJson情報を生成して返す
 */
function SearchAddress(props: Props, ref: React.ForwardedRef<SearchAddressHandler>) {
    const [address, setAddress] = useState('');
    const [candidates, setCandidates] = useState<GeocoderItem[]>([]);
    const [isIME, setIME] = useState(false);
    const [searchMode, setSearchMode] = useState(true); // trueの場合、addressが変化したら住所検索実行。候補から住所を選択した直後は住所検索を行わないようにするために用意。
    const lastSearchAddress = useRef<string>();    // 最後に検索文字列として渡された文字列（多重実行時の最後の結果を反映するようにするために用意）
    const [showProcessMessage, setShowSpinner] = useState(false);
    const { callApi } = useApi();

    const onInput = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
        const value = evt.target.value;
        setSearchMode(true);
        setAddress(value);
    }, []);

    const onCompositionSwitch = useCallback((mode: 'start' | 'end') => {
        setIME(mode === 'start');
    }, []);

    useImperativeHandle(ref, () => ({
        clear() {
            console.log('clear');
            setAddress('');
        },
        setAddress(address: string) {
            setAddress(address);
        }
    }));

    useEffect(() => {
        if (isIME) {
            // IME未確定中は検索しない
            return;
        }
        // カンマ区切りの数字の場合は、緯度経度
        const judgeLonLat = (address: string): undefined | {lat: number; lon: number} => {
            const location = address.split(',');
            if (location.length !== 2) {
                return undefined;
            }
            const lat = Number(location[0]);
            const lon = Number(location[1]);
            if (isNaN(lat) || isNaN(lon)) {
                return undefined;
            }
            return {lat, lon};
        }
        const lonlat = judgeLonLat(address);
        if (props.onAddress && lonlat) {
            props.onAddress({
                type: 'Point',
                coordinates: [lonlat.lon, lonlat.lat],
            } as Point);
            return;
        }

        // 住所検索
        search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isIME, address]);

    const search = useCallback(async() => {
        if (!searchMode) {
            return;
        }
        if (address.length === 0) {
            setCandidates([]);
            return;
        }

        // 住所検索
        setShowSpinner(true);
        lastSearchAddress.current = address;
        const searchResult = await callApi(GeocoderAPI, {
            address,
            searchTarget: props.searchTarget,
        });

        if (lastSearchAddress.current === address) {
            console.log('採用', address, searchResult);
            setCandidates(searchResult);
            lastSearchAddress.current = undefined;
            setShowSpinner(false);
        }

    }, [address, props.searchTarget, searchMode, callApi]);

    const onSelectCandidate = useCallback((item: GeocoderItem) => {
        if (props.onAddress) {
            const geoJson = {
                type: 'Feature',
                geometry: item.geoJson,
                properties: {
                    featureType: FeatureType.AREA,
                    geocoderId: item.idInfo,
                } as GeoProperties,
            } as GeoJsonObject;
            props.onAddress(geoJson);
        }
        setSearchMode(false);
        setAddress(item.name);
        setCandidates([]);
    }, [props]);

    return (
        <div>
            <Input type="text" placeholder='住所 または 緯度,経度'
                value={address}
                size={30}
                disabled={props.disabled}
                onCompositionStart={()=>onCompositionSwitch('start')} onCompositionEnd={()=>onCompositionSwitch('end')}
                onInput={onInput} />
            {showProcessMessage ?
                <Spinner />
                :
                <ListGroup>
                    {candidates.map(candidate => {
                        return (
                            <ListGroup.Item key={JSON.stringify(candidate.idInfo)} onClick={()=>onSelectCandidate(candidate)}>
                                {candidate.name}
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            }
        </div>
    );
}
export default React.forwardRef(SearchAddress);
