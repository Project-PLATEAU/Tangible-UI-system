import AddLocationOutlinedIcon from "@mui/icons-material/AddLocationOutlined";
import CreateIcon from "@mui/icons-material/Create";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { GoogleMap, useJsApiLoader, Rectangle } from "@react-google-maps/api";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState } from "recoil";

import { UserAvatarWrap } from "./components/modules/avatar-user";
import ModalTitleComment from "./components/modules/modal-title-comment";
import AreaCreator from "./components/modules/new-area-create";
import NewItem from "./components/modules/new-item";
import NewItemSmall from "./components/modules/new-item-small";

import {
    createNewArea,
    createOrUpdateWorkspace,
    refreshAreaMapImage,
    updateSingleArea
} from "./utils/firebase/firebase";
import { GeoUtils, GoogleMapOptions, GoogleMapUtils } from "./utils/GeoUtils";
import { Area, AreaUtils } from "./utils/models/Area";
import { MarkerType } from "./utils/models/Marker";
import { TangibleUtils } from './utils/models/Tangible';
import { Workspace, WorkspaceAtom, WorkspaceUtils } from "./utils/models/Workspace";

function New() {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_PUBLIC_GOOGLE_MAP_KEY,
    });

    const router = useNavigate();
    const { id } = useParams();

    const [progress, setProgress] = useState(false);
    const [progressMes, setProgressMes] = useState("");

    const [mapMode, setMapMode] = useState(0);
    // 0: default, 1: selectTangible, 2: areaselect, 3: areaedit
    const [centerState, setCenterState] = useState(GeoUtils.defaultCenter);

    const [wsState, setWSState] = useRecoilState(WorkspaceAtom);

    useEffect(() => {
        console.log(id);
        if (id) {
            loadWorkSpace(id);
        } else {
            router("/list")
        }
    }, []);

    const loadWorkSpace = async(id: string) => {
        const ws = await WorkspaceUtils.loadWorkSpaceWithId(id);
        setMapMode(0);
        if (ws) {
            const c = WorkspaceUtils.getCenter(ws);
            setCenterState(c);
            setWSState(ws);
        } else {
            router("/list");
        }
    };

    const [newArea, setNewArea] = useState<Area> (AreaUtils.createNew());
    const [selAreaIndex, setSelAreaIndex] = useState(-1);
    const areaSelectCallback = (event: {type: string, index: number, edgeIndex: number}) => {
        console.log(event)
        if (event.type === "area-rect") {
            if (mapMode === 0) {
                changeSelAreaIndex(event.index);
            }
        } else if (event.type === "area-small") {
            if (mapMode === 0) {
                changeSelAreaIndex(event.index);
            }
            if (mapMode > 1) {
                if (wsState.areas.length > event.index && event.index > -1) {
                    if (newArea.id === wsState.areas[event.index].id) {
                        return false;
                    }
                }
                if (event.index !== selAreaIndex) {
                    changeSelAreaIndex(event.index);
                }
            }
        } else if (event.type === "area-edge-select") {
            if (wsState.areas.length > event.index && event.index > -1) {
                const refArea = wsState.areas[event.index];
                const newCenter = TangibleUtils.getAreaCenterWithReferenceAndDirection(newArea, refArea, event.edgeIndex);
                const nArea = { ...newArea };
                const range = { ...nArea.area };
                range.center = newCenter;
                nArea.area = range;
                nArea.tangibleUpdate = true;
                const nA2 = AreaUtils.refreshAreaRectangle(nArea);
                setNewArea(nA2);
                if (mapMode < 2) {
                    setMapMode(2);
                }
            }
        }
        return true;
    };
    const changeSelAreaIndex = (index: number) => {
        if (selAreaIndex === index && selAreaIndex !== -1) {
            setSelAreaIndex(-1);
        } else {
            setSelAreaIndex(index);
        }
    };

    const areaCreatorCallback = (e: { type: string, area?: Area, mode?: number}) => {
        if (e.type === "area-creator-tangible") {
            if (e.area && e.mode) {
                setNewArea(e.area as Area);
                setMapMode(e.mode as number);
            }
        } else if (e.type === "area-creator-zoom") {
            if (e.area) {
                setNewArea(e.area as Area);
            }
        } else if (e.type === "area-creator-done") {
            if (e.area) {
                areaDicided(e.area as Area);
            }
        } else {
            setNewArea(AreaUtils.createNew());
            setMapMode(0);
        }
    }

    // ワークスペースタイトルモーダルのstate
    const [titleOpen, setTitleOpen] = useState(false);
    const modalCallbackWsTitle = (event: {type: string, title: string, comment: string}) => {
        if (event.type === "done") {
            const ws = { ...wsState };
            ws.title = event.title;
            ws.description = event.comment;
            setWSState(ws);
            saveWorkSpace(ws);
        }
        setTitleOpen(false)
    };
    const saveWorkSpace = async (ws: Workspace) => {
        console.log("saveWorkSpace");
        const wsID = await createOrUpdateWorkspace(ws);
        console.log(wsID);
        if (wsID) {
            loadWorkSpace(wsState.id);
            // if(ws.isNew) {
            //     router("/new/" + wsID);
            //     // これをつけないとリロードがかからないroutingの問題だとは思う
            //     router(0);
            // } else {
            //     loadWorkSpace(wsState.id);
            // }
            return;
        }
        setWSState(WorkspaceUtils.createNew());
    };

    // エリアセーブ（範囲変更、地図更新または新規作成）
    const areaDicided = async (area: Area) => {
        setProgress(true);
        if (mapMode === 3) {
            // save
            setProgressMes("エリア情報更新中...");
            const nM = area.markers.filter(m => m.type !== MarkerType.Building);
            const nA = { ...area };
            nA.markers = nM;
            setProgressMes("地図画像の生成中...");
            const areaID = await updateSingleArea(wsState, nA, true);
            if (areaID) {
                await refreshAreaMapImage(wsState.id, areaID);
            }
        } else {
            const areaID = await createNewArea(wsState, area);
            if (areaID) {
                setProgressMes("地図画像の生成中...")
                const url = await refreshAreaMapImage(wsState.id, areaID);
                console.log(url);
                setProgressMes("")
            }
        }
        setProgress(false);
        setProgressMes("");
        loadWorkSpace(wsState.id);
    };

    // Areaの場所セレクト
    const mapClicked = (event: google.maps.MapMouseEvent) => {
        if (mapMode === 1.5 || mapMode === 2 || mapMode === 3) {
            if (event.latLng) {
                setAreaRectFromMap(event.latLng as google.maps.LatLng);
            }
        }
    };
    const editAreaDrag = (e: google.maps.MapMouseEvent) => {
        if (mapMode === 2 || mapMode === 3) {
            if (e.latLng) {
                setAreaRectFromMap(e.latLng as google.maps.LatLng);
            }
        }
    };
    const setAreaRectFromMap = (latlng: google.maps.LatLng) => {
        const nArea = { ...newArea };
        const range = nArea.area
        const aa = {
            NE: { lat: range.NE.lat, lng: range.NE.lng },
            SW: { lat: range.SW.lat, lng: range.SW.lng },
            center: { lat: latlng.lat(), lng: latlng.lng() },
            zoom: range.zoom,
            rotation: range.rotation,
            map: range.map
        };
        nArea.area = aa;
        nArea.tangibleUpdate = true;
        const nA2 = AreaUtils.refreshAreaRectangle(nArea);
        // console.log(GeoUtils.getDistance(nA2.area.NE, nA2.area.SW))
        setNewArea(nA2);
        if (mapMode === 1.5) {
            setMapMode(2);
        }
    };

    const addAreaPressed = () => {
        setMapMode(1);
        const nArea = AreaUtils.createNew();
        nArea.title = "新規エリア";
        setNewArea(nArea);
    };

    const areaDetailCallback = (event: {type: string }, index: number) => {
        if (event.type === "showprogress") {
            setProgress(true);
            setProgressMes("更新中...");
        }
        if (event.type === "reload") {
            setProgress(false);
            setProgressMes("");
            loadWorkSpace(wsState.id);
        }
        if (event.type === "titleselect") {
            changeSelAreaIndex(index);
        }
        if (event.type === "areaedit") {
            changeSelAreaIndex(index);
            const eA = { ...wsState.areas[index] };
            const aa = {
                NE: { lat: eA.area.NE.lat, lng: eA.area.NE.lng },
                SW: { lat: eA.area.SW.lat, lng: eA.area.SW.lng },
                center: { lat: eA.area.center.lat, lng: eA.area.center.lng },
                zoom: eA.area.zoom,
                rotation: eA.area.rotation,
                map: eA.area.map
              };
            eA.area = aa;
            setNewArea(eA);
            setMapMode(3);
        }
    };

    const itemClickable = () => {
        return mapMode === 0;
    }

    const isEditMode = () => {
        return mapMode === 2 || mapMode === 3;
    }

    const pageCancelClicked = () => {
        router("/detail/" + wsState.id);
    };

    return (
        <main className="main">
            <Stack direction="row" spacing={'15px'} className="new-button">
                <Button variant="outlined" onClick={pageCancelClicked}>{ "詳細へ戻る" }</Button>
            </Stack>

            <Stack className="new-header">
                <Stack direction="row" justifyContent="space-between" alignItems="center" className="new-header__header">
                    <h1 className="new-header__heading">{wsState.title}</h1>
                    <IconButton
                        onClick={() => setTitleOpen(true)}>
                        <CreateIcon />
                    </IconButton>
                </Stack>
                <TextField
                    label="ワークスペースの説明"
                    multiline
                    rows={2}
                    focused={false}
                    inputProps={{ readOnly: true }}
                    value={wsState.description}
                    className="new-header__textarea"
                    onClick={() => setTitleOpen(true)}
                    fullWidth
                />
                <UserAvatarWrap size={40} />
            </Stack>

            <Box className="new-meta">
                <Stack component="ul" direction="row" spacing={'33px'} className="new-meta__list" key="small_list">
                    { wsState.areas.map((area: Area, i: number) => {
                        return <NewItemSmall 
                            area={area}
                            key={i}
                            index={i}
                            mode={mapMode}
                            selected={i === selAreaIndex}
                            callback={areaSelectCallback}
                            />
                    })}
                </Stack>
                { mapMode === 0 ? (
                    <Button
                        onClick={addAreaPressed}
                        variant="contained"
                        color="primary"
                        className="new-meta__button"
                        startIcon={<AddLocationOutlinedIcon />}
                    >
                        検討範囲を追加
                    </Button>
                ) : (
                    <AreaCreator
                        workspace={wsState}
                        area={newArea}
                        mapMode={mapMode}
                        callback={areaCreatorCallback} />
                )}
            </Box>

            <Box className="new-map">
                { isLoaded && (
                    <GoogleMap
                        center={centerState}
                        zoom={16}
                        mapContainerClassName="map"
                        id={"map-new"}
                        options={GoogleMapOptions.mapOptions}
                        onClick={mapClicked}
                    >
                        { isEditMode() &&
                            <Rectangle 
                                bounds={GoogleMapUtils.getRectangleBoundsFromArea(newArea)}
                                options={GoogleMapOptions.rectangleOptionEdit}
                                onDragEnd={editAreaDrag}
                                onClick={mapClicked} />
                        }
                        { wsState.areas.map((area: Area, i: number) => {
                            const option = i === selAreaIndex ? GoogleMapOptions.rectangleOptionSelected : GoogleMapOptions.rectangleOption;
                            const bounds = GoogleMapUtils.getRectangleBoundsFromArea(area);
                            if (mapMode === 0) {
                                return <Rectangle 
                                    key={i + 1}
                                    bounds={bounds}
                                    options={option} 
                                    onClick={() => { areaSelectCallback({type: "area-rect", index: i, edgeIndex: -1}); }}/>
                            } else {
                                if (mapMode === 3 && newArea.id === area.id) {
                                    return null;
                                } else {
                                    return <Rectangle 
                                        key={i + 1}
                                        bounds={bounds}
                                        options={option}
                                        onClick={mapClicked}/>
                                }
                            }
                        })}
                    </GoogleMap>
                )}
            </Box>

            <Box component="article" className="new-list">
                {wsState.areas.map((area: Area, i: number) => {
                    return <NewItem 
                        workspace={wsState}
                        area={area}
                        key={i}
                        disable={!itemClickable()}
                        selected={i === selAreaIndex}
                        callback={(event) => {
                            areaDetailCallback(event, i);
                        }}/>
                })}
            </Box>

            <ModalTitleComment
                open={titleOpen}
                modalTitle="ワークスペースタイトル"
                title={wsState.title}
                comment={wsState.description}
                doneText="作成"
                modalKey="new-workspace"
                callback={modalCallbackWsTitle}/>
            <Backdrop open={progress}>
                <CircularProgress color="primary"/>
                <Typography variant="h3" sx={{ m: "12px", color: "#cccccc" }}>{ progressMes }</Typography>
            </Backdrop>
        </main>
    )
}

export default New
