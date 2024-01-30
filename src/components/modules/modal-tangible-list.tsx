import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

// import TextField from "@mui/material/TextField";

import ModalTitle from "./modal-title";

import { getAllTangibles, getSimpleWorkSpaceAndArea } from "../../utils/firebase/firebase";

import { Area } from "../../utils/models/Area";
import { Tangible, TangibleUtils } from "../../utils/models/Tangible";
import { Workspace } from "../../utils/models/Workspace";

function ModalTangibleList(props:{ 
    open: boolean,
    workspace: Workspace,
    area: Area | null,
    doneText?: string,
    callback?: (event: { type: string, tangible?: Tangible }) => void
}) {
    const [openState, setOpenState] = useState(props.open)

    const [tangibles, setTangibles] = useState<Tangible[]>([]);
    const [selTangible, setSelTangible] = useState<Tangible>(TangibleUtils.createBlank());
    const [tangibleMessage, setTangibleMessage] = useState("");
    const [usedFlag, setUsedFlag] = useState(false);

    const [listAnchorEl, setListAnchorEl] = useState<null | HTMLElement>(null);
    const listOpen = Boolean(listAnchorEl);
    const listOpenClick = (event: React.MouseEvent<HTMLElement>) => {
        setListAnchorEl(event.currentTarget);
    };

    const listCloseClick = (t: Tangible) => {
        setListAnchorEl(null);
        setSelTangible(t);
        checkUsed(t);
    };

    const listCancelClick = () => {
        setListAnchorEl(null);
    };

    const [titleOpen, setTitleOpen] = useState(false);



    useEffect(() => {
        setOpenState(props.open)
        if (props.open) {
            loadTangibles();
        }
    }, [props.open])

    const loadTangibles = async () => {
        const list = await getAllTangibles();
        setTangibles(list);
        setTangibleMessage("")
    }

    const checkUsed = async (t: Tangible) => {
        if (t.area) {
            const wsID = t.area.workspaceID;
            const areaID = t.area.areaID;
            const ws = await getSimpleWorkSpaceAndArea(wsID, areaID);
            if(ws) {
                let m = "ワークスペース「" + ws.title + "」のエリア「" + ws.areas[0].title + "」";
                if (t.active) {
                    m = m + "にて現在使用中です。"
                } else {
                    m = m + "と連携しています"
                }
                setTangibleMessage(m);
                setUsedFlag(true);
            } else {
                t.area = undefined;
                setSelTangible(t);
                setTangibleMessage("利用可能です");
                setUsedFlag(false);
            }
        } else {
            setTangibleMessage("利用可能です");
            setUsedFlag(false);
        }
    }

    const cancelHandler = () => {
        if(props.callback) {
            props.callback({
                type: "cancel",
            })
        }
        setOpenState(false)
    }

    const okHandler = () => {
        if (selTangible) {
            if (usedFlag) {
                setTitleOpen(true);
            } else {
                doneHandler();
            }
        }
    }

    const doneHandler = () => {
        if (selTangible.isBlank) {
            setOpenState(false);
            return;
        }
        if(props.callback) {
            props.callback({
                type: "tangible",
                tangible: selTangible,
            });
        }
        setOpenState(false);
    }

    const confirmCallback = (event: { type: string, value: string, key: string }) => {
        setTitleOpen(false);
        if (event.type === "done") {
            doneHandler();
        }
    }

    return (
        <>
            <Modal
                open={openState}
                onClose={cancelHandler} >
                <Box className="modal -small">
                    <h2 className="modal__heading">タンジブルユニットの選択</h2>
                    <Button
                        className="new-meta__button"
                        id="new-list_menuButton"
                        aria-controls={listOpen ? "tanible-list__menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={listOpen ? "true" : undefined}
                        onClick={listOpenClick}
                        variant="outlined"
                        color="primary"
                        startIcon={<MenuIcon />}
                    >
                        { selTangible.isBlank ? "タンジブルユニットID" : selTangible.id }
                    </Button>
                    <Menu
                        className="new-list__menu"
                        aria-labelledby="new-list_menuButton"
                        anchorEl={listAnchorEl}
                        open={listOpen}
                        onClose={() => listCancelClick()}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left",
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "left",
                        }}
                    >
                        {tangibles.map((t: Tangible) => {
                            return <MenuItem onClick={() => listCloseClick(t)} key={t.id}>{t.id}</MenuItem>;
                        })}
                    </Menu>
                    <Box sx={{m: "15px"}}>
                        <p className="modal__text">{tangibleMessage}</p>
                    </Box>
                    <Stack direction="row" spacing={'15px'} className="modal__button">
                        <Button variant="contained" color="secondary" onClick={okHandler}>{ props.doneText ?? "選択" }</Button>
                        <Button variant="outlined" type="reset" onClick={cancelHandler}>キャンセル</Button>
                    </Stack>
                </Box>
            </Modal>
            <ModalTitle
                open={titleOpen}
                modalTitle="タンジブルユニット接続確認"
                value="他のエリアで使用中のタンジブルユニットをこのエリアで使用しますか？"
                modalKey="force-connect"
                doneText="使用する"
                callback={confirmCallback}
                />
        </>
    )
}

export default ModalTangibleList
