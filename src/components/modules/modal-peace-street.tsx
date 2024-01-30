
import { Box, InputLabel, MenuItem, Switch } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
// import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import React, { useState, useEffect } from "react";

import { Area } from "../../utils/models/Area";
import { Furniture, FrnUtils } from "../../utils/models/Furniture";
import { Marker, MarkerUtils, MarkerType } from "../../utils/models/Marker";

interface ItemInterFace {
    item: Furniture
    selected: boolean
    index: number
    markerID: string
    callback?: (event: { type: string, value: boolean, index: number }) => void
}

interface MarkerInterFace {
    area: Area,
    frns: Furniture[],
    callback?: (event: { type: string, markers: Marker[] }) => void
}

const ListItems: React.FC<ItemInterFace> = (props) => {
    const item = props.item;
    const [thumb, setThumb] = useState("");
    // const [comment, setComment] = useState("");
    const [selected, setSelected] = useState(props.selected);

    useEffect(() => {
        if(!thumb) {
            loadThumbnail();
        }
    }, [])

    useEffect(() => {
        setSelected(props.selected);
    }, [props.selected]);

    const loadThumbnail = async () => {
        const url = await FrnUtils.loadThumbUrl(props.item);
        // setComment("");
        if (url) {
            setThumb(url);
        }
    };

    const selectSwichPressed = () => {
        if(props.callback) {
            props.callback({
                "type": "select",
                "value": !selected,
                "index": props.index
            });
        }
    };

    return (
        <>
            {item.id === "" ? <p className="street-list__empty">{item.name}</p> : <div className="street-list__item">
                <figure className="street-list__image">
                    <img src={thumb} alt="" width={320} height={180} decoding="async" />
                </figure>
                <div className="street-list__content">
                    <h3 className="street-list__heading">{item.name}</h3>
                    <h4 className="street-list__type">{item.type}</h4>
                    {props.markerID !== "-1" && <p className="street-list__id">ID: {props.markerID}</p>}
                    {/* {selected && 
                        <TextField
                            label="コメントを入力"
                            multiline
                            rows={2}
                            className="street-list__textarea"
                            defaultValue={comment}
                            fullWidth
                        />
                    } */}
                    {/* {comment !== '' ? <TextField
                        label="コメントを入力"
                        multiline
                        rows={2}
                        className="street-list__textarea"
                        defaultValue={comment}
                        fullWidth
                        /> : <TextField
                        label="コメントを入力"
                        multiline
                        rows={2}
                        className="street-list__textarea"
                        fullWidth
                    />} */}
                    <Switch
                        className="street-list__switch"
                        aria-label="追加"
                        checked={selected}
                        onChange={selectSwichPressed}
                        />
                </div>
            </div>}
        </>
    );
};

const ModalPeaceStreet: React.FC<MarkerInterFace> = (props) => {
    const [markers, setMarkers] = useState<Marker[]>([]);
    const [frns, setFrns] = useState<Furniture[]>([]);
    const [filterValue, setFilterValue] = useState("none");

    useEffect(() => {
        setMarkers(props.area.markers);
        
    }, [props.area])

    useEffect(() => {
        filterMarkers(filterValue);
    }, [props.frns])

    const selectorChange = (event: SelectChangeEvent) => {
        // console.log(event.target.value);
        setFilterValue(event.target.value);
        filterMarkers(event.target.value);
    };

    const filterMarkers = (value: string) => {
        const fM = props.frns.filter((frn: Furniture) => {
            if (value === "none") {
                return true;
            }
            return frn.type === value;
        });
        setFrns(fM);
    };

    const listItemCallback = (e: { type: string, value: boolean, index: number }) => {
        if (e.type === "select") {
            console.log(e)
            const frn = props.frns[e.index];
            if (e.value === true) {
                const m = MarkerUtils.findMarkersFromObjIDIncludeDelete(frn.id, markers);
                if (m.length === 0) {
                    const newMarker = MarkerUtils.createMarkerFromFrn(frn, markers);
                    const mList = MarkerUtils.addMarker(newMarker, markers);
                    if (props.callback) {
                        props.callback({
                            type: "marker",
                            markers: mList,
                        });
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
                const m = MarkerUtils.findMarkersFromObjID(frn.id, markers);
                if (m.length > 0) {
                    const mList = MarkerUtils.removeMarkerFromUniqueID(frn.id + "_" + m[0].markerID, MarkerType.Furniture, markers);
                    if (props.callback) {
                        props.callback({
                            type: "marker",
                            markers: mList,
                        });
                    }    
                }
            }
        }
    };

    return (
        <Box className="street">
            <Box className="street-search">
                <InputLabel id="filter-label" sx={{fontSize: "1.2rem"}}>フィルタ</InputLabel>
                <Select
                    labelId='filter-label'
                    variant='outlined'
                    value={filterValue}
                    label="Filter"
                    onChange={selectorChange}
                    autoWidth
                    sx={{fontSize: "1.6rem"}}
                >
                    <MenuItem color="variant" value="none">無し</MenuItem>
                    <MenuItem value="building">建物(LOD2)</MenuItem>
                    <MenuItem value="facility">施設</MenuItem>
                    <MenuItem value="furniture">設備など</MenuItem>
                    <MenuItem value="car">車・乗り物</MenuItem>
                </Select>
            </Box>
            <Box component="article" className="street-list">
                {frns.map((frn: Furniture, i: number) => {
                    const selected = markers.filter((marker: Marker) => {
                        if (marker.type === MarkerType.Furniture && marker.objID === frn.id) {
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
                                key={frn.id}
                                item={frn}
                                index={i}
                                markerID={markerID}
                                selected={selected.length > 0}
                                callback={listItemCallback}/>;
                })}
            </Box>
        </Box>
    )
}

export default ModalPeaceStreet
