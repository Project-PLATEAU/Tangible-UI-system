import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';

import { Area } from '../../utils/models/Area';
import { SpecialFrn } from '../../utils/models/Furniture';
import { Marker, MarkerUtils, MarkerType } from '../../utils/models/Marker';

interface ItemInterFace {
    item: SpecialFrn
    selected: boolean
    index: number
    markerID: string
    callback?: (event: { type: string, value: boolean, index: number }) => void
}

interface MarkerInterFace {
    area: Area,
    sFrns: SpecialFrn[],
    callback?: (event: { type: string, markers: Marker[] }) => void
}

const ListItems: React.FC<ItemInterFace> = (props) => {
    const item = props.item;
    const [aruco, setAruco] = useState("");
    const [selected, setSelected] = useState(props.selected);

    useEffect(() => {
        setArucoSrc();
    }, [])

    useEffect(() => {
        setSelected(props.selected);
    }, [props.selected]);

    const setArucoSrc = () => {
        const n = Number(props.item.markerID) as number
        setAruco("/aruco/4x4_1000-" + n + ".svg")
    }

    const selectSwichPressed = () => {
        if(props.callback) {
            props.callback({
                "type": "select",
                "value": !selected,
                "index": props.index
            });
        }
    }

    return (
        <>
            {item.id === "" ? <p className="street-list__empty">{item.name}</p> : <div className="street-list__item">
                <figure className="detail-street__qr">
                    <img src={aruco} alt="" width={120} height={120} style={{padding: "0 16px 16px 16px"}} decoding="async"/>
                    <figcaption className="detail-street__markerId">{props.item.markerID}</figcaption>
                </figure>
                <div className="street-list__content">
                    <h3 className="street-list__heading">{item.name}</h3>
                    <h4 className="street-list__type">{item.type}</h4>
                    {props.markerID !== "-1" && <p className="street-list__id">ID: {props.markerID}</p>}
                    <Switch
                        className="street-list__switch"
                        aria-label="追加"
                        checked={selected}
                        onChange={selectSwichPressed}
                        />
                </div>
            </div>}
        </>
    )
}

const ModalPeaceSpecial: React.FC<MarkerInterFace> = (props) => {
    const [markers, setMarkers] = useState<Array<Marker>>([]);

    useEffect(() => {
        setMarkers(props.area.markers);
    }, [props.area])

    const listItemCallback = (e: { type: string, value: boolean, index: number }) => {
        if (e.type === "select") {
            console.log(e)
            const sFrn = props.sFrns[e.index];
            if (e.value === true) {
                const m = MarkerUtils.findMarkersFromObjIDIncludeDelete(sFrn.id, markers);
                if (m.length === 0) {
                    const newMarker = MarkerUtils.createMarkerFromSpecialFrn(sFrn);
                    const mList = MarkerUtils.addMarker(newMarker, markers);
                    if (props.callback) {
                        props.callback({
                            type: "marker",
                            markers: mList,
                        })
                    }
                } else {
                    let mList = markers;
                    for (const mk of m) {
                        mList = MarkerUtils.addMarker(mk, markers);
                    }
                    if (props.callback) {
                        props.callback({
                            type: "marker",
                            markers: mList,
                        });
                    }
                }
            } else {
                const m = MarkerUtils.findMarkersFromObjID(sFrn.id, markers);
                if (m.length > 0) {
                    const mList = MarkerUtils.removeMarkerFromUniqueID(sFrn.id, MarkerType.Special, markers);
                    if (props.callback) {
                        props.callback({
                            type: "marker",
                            markers: mList,
                        });
                    }
                }
            }
        }
    }

    return (
        <div className="street">
            <Box component="article" className="street-list">
                {props.sFrns.map((sFrn: SpecialFrn, i: number) => {
                    const selected = markers.filter((marker: Marker) => {
                        if (marker.type === MarkerType.Special && marker.objID === sFrn.id) {
                            return !marker.delete;
                            // return true;
                        }
                        return false;
                    })
                    let markerID = "-1";
                    if (selected.length > 0) {
                        markerID = selected[0].markerID;
                    }
                    return <ListItems
                                key={i}
                                item={sFrn}
                                index={i}
                                markerID={markerID}
                                selected={selected.length > 0}
                                callback={listItemCallback}/>;
                })}
            </Box>
        </div>
    )
}

export default ModalPeaceSpecial
