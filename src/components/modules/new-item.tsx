import React, { useState, useEffect } from 'react';
// import BedroomBabyOutlinedIcon from "@mui/icons-material/BedroomBabyOutlined";
// import CreateIcon from '@mui/icons-material/Create';
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import QrCode from "@mui/icons-material/QrCode";
// import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Typography } from "@mui/material";

import { useRecoilState } from "recoil";

import ModalDelete from "./modal-delete";
import ModalPeace from "./modal-peace";
import ModalPeaceSort from "./modal-peace-sort";
import ModalTangibleList from "./modal-tangible-list";
import ModalTitle from "./modal-title";

import { EditAreaAtom } from "../../utils/AppUtils";
import { Area, AreaUtils } from "../../utils/models/Area";
import { GoogleMapUtils } from '../../utils/GeoUtils';
import { Tangible } from "../../utils/models/Tangible";
import { Workspace } from "../../utils/models/Workspace";
import { deleteArea, refreshAreaMapImage, updateSingleArea } from "../../utils/firebase/firebase";

function NewItem(
    props:{
        workspace: Workspace,
        area: Area,
        selected: boolean,
        disable: boolean,
        callback?: (event: { type: string }) => void
    }) {
    const [editAreaState, setEditAreaState] = useRecoilState(EditAreaAtom);
    const [areaState, setAreaState] = useState<Area>(props.area)
    useEffect(() => {
        setAreaState(props.area);
    }, [props.area]);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };


    const [deleteOpen, setDeleteOpen] = useState(false);
    const modalDeleteCallback = (event: { type: string }) => {
        if(event.type === "done") {
            console.log("do delete")
            doDeleteArea(areaState);
        }
        setDeleteOpen(false);
    }

    const [keyOpen, setKeyOpen] = useState(false);
    const modalKeyCallback = (event:  { type: string, tangible?: Tangible }) => {
        if (event.type === "tangible") {
            if (event.tangible) {
                const nA = AreaUtils.setTangible(areaState, event.tangible);
                updateArea(nA, false, true);
            }
        }
        setKeyOpen(false);
    }

    const [pieceOpen, setPieceOpen] = useState(false);
    const modalPieceCallback = (event: { type: string, area?: Area }) => {
        if(event.type === "done") {
            if (event.area) {
                updateArea(event.area, true, false);
            }
        }
        setPieceOpen(false);
    }

    const [pieceSortOpen, setPieceSortOpen] = useState(false);
    const modalPieceSortCallback = (event: { type: string, area?: Area }) => {
        if(event.type === "done") {
            if (event.area) {
                updateArea(event.area, true, false);
            }
        }
        setPieceSortOpen(false);
    }

    const [titleOpen, setTitleOpen] = useState(false);
    const modalTitleCallback = (event: { type: string, key: string, value: string }) => {
        if(event.type === "done") {
            const nA = { ...areaState };
            nA.title = event.value;
            updateArea(nA, false, false);
        }
        setTitleOpen(false);
    }

    const updateArea = async (area: Area, mFlag: boolean, map: boolean) => {
        if (props.callback) {
            props.callback({
                type: "showprogress",
            });
        }
        const areaID = await updateSingleArea(props.workspace, area, mFlag);
        if (areaID) {
            if (map) {
                await refreshAreaMapImage(props.workspace.id, areaID);
            }
            if (props.callback) {
                props.callback({
                    type: "reload",
                });
            }
        }
    }

    const doDeleteArea = async (area: Area) => {
        if (props.callback) {
            props.callback({
                type: "showprogress",
            });
        }
        if (await deleteArea(props.workspace.id, area)) {
            if (props.callback) {
                props.callback({
                    type: "reload",
                });
            }
        }
    };

    const titleClicked = () => {
        if (props.callback) {
            props.callback({
                type: "titleselect",
            });
        }
    };

    const areaEditClicked = () => {
        if (props.callback) {
            props.callback({
                type: "areaedit",
            });
        }
    };

    const pasteEnable = () => {
        if (editAreaState.edit) {
            const refArea = props.workspace.areas.find(area => area.id === editAreaState.id);
            if (refArea) {
                return refArea.id !== areaState.id;
            }
        }
        return false;
    }

    const copyBtnClicked = () => {
        setEditAreaState({ edit: true, id: areaState.id });
    };

    const pasteBtnClicked = () => {
        const refArea = props.workspace.areas.find(area => area.id === editAreaState.id);
        if (refArea) {
            const nA = { ...areaState };
            const nM = refArea.markers;
            nA.markers = nM;
            // console.log(areaState)
            // console.log(refArea)
            // console.log(nA)
            updateArea(nA, true, false);
        }
        setEditAreaState({ edit: false, id: "" });
    };

    return (
        <>
            <Box className="new-list__item">
                {props.selected ?
                    <h2 className="new-list__heading selected" onClick={() => titleClicked()}>
                        <LayersOutlinedIcon className="icon" />
                        { areaState.title }
                        <Typography
                            variant="body1"
                            component="span"
                            sx={{fontWeight: "bold", fontSize: "1.4rem", ml: "18px"}}>
                            {GoogleMapUtils.getZoomString(areaState.area.zoom)}
                        </Typography>
                    </h2> : 
                    <h2 className="new-list__heading" onClick={() => titleClicked()}>
                        <LayersOutlinedIcon className="icon" />
                        { areaState.title }
                        <Typography
                            variant="body1"
                            component="span"
                            sx={{fontWeight: "bold", fontSize: "1.4rem", ml: "18px"}}>
                            {GoogleMapUtils.getZoomString(areaState.area.zoom)}
                        </Typography>
                    </h2>
                }
                <table className="new-list__table">
                    <tbody>
                        <tr>
                            <th>タンジブルユニット連携キー</th>
                            <td>
                                {areaState.tangibleID}
                                <IconButton onClick={() => setKeyOpen(true)}>
                                    <MenuIcon className="icon -gray"/>
                                </IconButton>
                            </td>
                            <td>
                                <Button onClick={areaEditClicked} variant="contained" color="info" className="new-list__button">エリアの編集</Button>
                            </td>
                        </tr>
                        <tr>
                            <th>タンジブル駒</th>
                            <td>
                                {areaState.markers.length} / 99
                                <IconButton onClick={() => setPieceSortOpen(true)}>
                                    <QrCode className="icon -gray" />
                                </IconButton>
                            </td>
                            <td>
                                <Button onClick={() => setPieceOpen(true)} variant="contained" color="info" className="new-list__button">タンジブル駒を設定</Button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <IconButton
                    className="new-list__menuButton"
                    id="new-list_menuButton"
                    aria-controls={open ? 'new-list__menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleClick}
                >
                    <MenuIcon />
                </IconButton>
                <Menu
                    className="new-list__menu"
                    aria-labelledby="new-list_menuButton"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                >
                    {/* <MenuItem onClick={handleClose}>範囲編集</MenuItem> */}
                    <MenuItem onClick={() => {
                        handleClose();
                        setTitleOpen(true);
                    }}>名称編集</MenuItem>
                    <MenuItem onClick = {() => {
                        handleClose();
                        copyBtnClicked();
                    }}>駒コピー</MenuItem>
                    { pasteEnable() &&
                        <MenuItem onClick = {() => {
                            handleClose();
                            pasteBtnClicked();
                        }}>駒ペースト</MenuItem>
                    }
                    <MenuItem onClick = {() => {
                        handleClose();
                        setDeleteOpen(true);
                    }}>削除</MenuItem>
                </Menu>
                { props.disable &&
                    <Box sx={{width: "100%", height: "100%", position: "absolute", top: "0px", left: "0px", backgroundColor: "#00000066", borderRadius: "5px"}}/>
                }
            </Box>

            {/* エリア名称を引き継ぐために一旦ここにモーダル設置 */}
            <ModalDelete open={deleteOpen} title="エリアの削除" comment={areaState.title} callback={modalDeleteCallback} />
            <ModalPeace open={pieceOpen} area={areaState} callback={modalPieceCallback} />
            <ModalPeaceSort open={pieceSortOpen} area={areaState} callback={modalPieceSortCallback} />
            <ModalTangibleList
                open={keyOpen}
                workspace={props.workspace}
                area={props.area}
                doneText="変更"
                callback={modalKeyCallback}/>
            <ModalTitle
                open={titleOpen}
                modalTitle="エリアタイトル"
                value={areaState.title}
                modalKey="edit-area"
                doneText="保存"
                callback={modalTitleCallback}
                />
        </>
    )
}

export default NewItem
