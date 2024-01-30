import MenuIcon from "@mui/icons-material/Menu";
import { Button, Menu, MenuItem, Stack } from "@mui/material/";

import React, { useState, useEffect } from "react";

import ModalTangibleList from "./modal-tangible-list";
import ModalTitle from "./modal-title";
import { Area, AreaUtils } from "../../utils/models/Area";
import { GoogleMapUtils } from "../../utils/GeoUtils";
import { Tangible } from "../../utils/models/Tangible";
import { Workspace } from "../../utils/models/Workspace";

function AreaCreator(
    props:{
        workspace: Workspace,
        area: Area,
        mapMode: number,
        callback?: (event: { type: string, area?: Area, mode?: number }) => void
    }
) {

    const [newArea, setNewArea] = useState<Area>(AreaUtils.createNew());
    useEffect(() => {
        setNewArea(props.area);
    }, [props.area]);

    // Tangibleセレクト
    const [modalTangible, setModalTangible] = useState(false);
    const modalTangibleCallback = (event: {type: string, tangible?: Tangible}) => {
        setModalTangible(false);
        if (event.type === "tangible") {
            if (event.tangible) {
                const nA = AreaUtils.setTangible(newArea, event.tangible as Tangible);
                setNewArea(nA);
                let mode = props.mapMode;
                if (mode === 1) {
                    mode = 1.5;
                }
                if (props.callback) {
                    props.callback({
                        type: "area-creator-tangible",
                        area: nA,
                        mode: mode,
                    });
                }
            }
        }
    };
    const tangibleOpenClick = () => {
        setModalTangible(true);
    };

    // 新規エリアモーダルのstate
    const [areaOpen, setAreaOpen] = useState(false);
    const modalCallbackAreaTitle = async (event:  { type: string, key: string, value: string }) => {
        setAreaOpen(false);
        if (event.type === "done") {
            const nA = { ...newArea }
            nA.title = event.value;
            if (props.callback) {
                props.callback({
                    type: "area-creator-done",
                    area: nA,
                });
            }
        }
    };

    // AreaのzoomScaleロジック
    const [zoomAnchorEl, setZoomAnchorEl] = useState<null | HTMLElement>(null);
    const zoomOpen = Boolean(zoomAnchorEl);
    const zoomOpenClick = (event: React.MouseEvent<HTMLElement>) => {
        setZoomAnchorEl(event.currentTarget);
    };
    const zoomCloseClick = (zoom: number) => {
        if (zoom && zoom > 15 && zoom < 25) {
            const nArea = { ...newArea };
            nArea.area.zoom = zoom;
            if (props.mapMode === 2 || props.mapMode === 3) {
                nArea.tangibleUpdate = true;
                const nA2 = AreaUtils.refreshAreaRectangle(nArea);
                setNewArea(nA2);
                if (props.callback) {
                    props.callback({
                        type: "area-creator-zoom",
                        area: nA2,
                    });
                }
            }
        }
        setZoomAnchorEl(null);
    };
    const getZoomLabel = () => {
        // 1/50: 23.14, 1/100: 22.14, 1/200: 21.14, 1/400: 20.14
        // 1/500: 19.82, 1/1000: 18.82
        // if (newArea.area.zoom === 20.145) {
        //     return "1/400";
        // } else if (newArea.area.zoom === 21.145) {
        //     return "1/200";
        // } else if (newArea.area.zoom === 22.145) {
        //     return "1/100";
        // } else if (newArea.area.zoom === 23.145) {
        //     return "1/50";
        // } else if (newArea.area.zoom === 19.823) {
        //     return "1/500";
        // } else if (newArea.area.zoom === 18.823) {
        //     return "1/1000";
        // } else if (newArea.area.zoom === 17) {
        //     return "17";
        // } else if (newArea.area.zoom === 18) {
        //     return "18";
        // }
        const s = GoogleMapUtils.getZoomString(newArea.area.zoom);
        if (s === "unknown") {
            return "スケール選択";
        } else {
            return s;
        }
    };
    
    const addAreaCancelPressed = () => {
        setNewArea(AreaUtils.createNew());
        if (props.callback) {
            props.callback({
                type: "area-creator-cancel",
                mode: 0,
            });
        }
    };

    const doneHandler = async () => {
        if (props.mapMode === 2) {
            setAreaOpen(true);
        } else {
            if (props.callback) {
                props.callback({
                    type: "area-creator-done",
                    area: newArea,
                });
            }
        }
    };

    return (
        <>
            <Stack direction="row" justifyContent="space-between" spacing={"33px"} alignItems="center" >
                { props.mapMode === 3 ? (
                    <Button
                        className="new-meta__button"
                        id="new-list_tangibleButton"
                        disabled={true}
                        variant="outlined"
                        color="primary"
                    >
                        { newArea.tangibleID }
                    </Button>
                ) : (
                    <Button
                        className="new-meta__button"
                        id="new-list_tangibleButton"
                        onClick={tangibleOpenClick}
                        variant="contained"
                        color="primary"
                        startIcon={<MenuIcon />}
                    >
                        { newArea.tangible ? newArea.tangibleID : "タンジブルユニット選択"}
                    </Button>
                )}
                { newArea.tangible && (
                <>
                    <Button
                        className="new-meta__button"
                        id="new-list_menuButton"
                        aria-controls={zoomOpen ? "zoom-list__menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={zoomOpen ? "true" : undefined}
                        onClick={zoomOpenClick}
                        variant="contained"
                        color="primary"
                        startIcon={<MenuIcon />}
                    >
                    { getZoomLabel() }
                    </Button>
                    <Menu
                        className="new-list__menu"
                        aria-labelledby="new-list_menuButton"
                        anchorEl={zoomAnchorEl}
                        open={zoomOpen}
                        onClose={() => zoomCloseClick(0)}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left",
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "left",
                        }}
                    >
                        <MenuItem onClick={() => zoomCloseClick(17.823)}>{GoogleMapUtils.getZoomString(17.823)}</MenuItem>
                        <MenuItem onClick={() => zoomCloseClick(18.823)}>{GoogleMapUtils.getZoomString(18.823)}</MenuItem>
                        <MenuItem onClick={() => zoomCloseClick(20.145)}>{GoogleMapUtils.getZoomString(20.145)}</MenuItem>
                        <MenuItem onClick={() => zoomCloseClick(21.145)}>{GoogleMapUtils.getZoomString(21.145)}</MenuItem>
                        <MenuItem onClick={() => zoomCloseClick(22.145)}>{GoogleMapUtils.getZoomString(22.145)}</MenuItem>
                        <MenuItem onClick={() => zoomCloseClick(23.145)}>{GoogleMapUtils.getZoomString(23.145)}</MenuItem>
                    </Menu>
                    { props.mapMode >= 2 &&
                        <Button
                            className="new-meta__button"
                            onClick={doneHandler}
                            variant="contained"
                            color="secondary">
                            決定
                        </Button>
                    }
                </>
                )}
                <Button
                    onClick={addAreaCancelPressed}
                    variant="outlined"
                    color="primary"
                    className="new-meta__button">
                    キャンセル
                </Button>
            </Stack>
            <ModalTangibleList
                open={modalTangible}
                workspace={props.workspace}
                area={newArea}
                callback={modalTangibleCallback}/>
            <ModalTitle
                open={areaOpen}
                modalTitle="検討範囲タイトル"
                value={newArea.title}
                modalKey="new-area"
                doneText="作成"
                callback={modalCallbackAreaTitle}/>

        </>
    )
}

export default AreaCreator
