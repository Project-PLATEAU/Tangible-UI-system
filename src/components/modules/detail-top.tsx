import MenuIcon from "@mui/icons-material/Menu";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";

import { UserAvatarWrap } from "./avatar-user";
import ModalDelete from "./modal-delete";
import { deleteWorkspace } from "../../utils/firebase/firebase";
import { WorkspaceAtom, WorkspaceUtils } from "../../utils/models/Workspace";
import { getDateString } from "../../utils/UserUtils";

function DetailTop() {
    const [wsState, setWSState] = useRecoilState(WorkspaceAtom);
    const router = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);

    };
    const handleEdit = () => {
        setAnchorEl(null);
        router("/new/" + wsState.id);
    };

    const [deleteOpen, setDeleteOpen] = useState(false);
    const handleDeleteOpen = () => setDeleteOpen(true);
    const handleDeleteClose = (event: { type: string }) => {
        setDeleteOpen(false);
        if(event.type === "done") {
            console.log("do delete")
            doDeleteWorkspace();
        }
    };

    const doDeleteWorkspace = async () => {
        if (await deleteWorkspace(wsState.id)) {
            setWSState(WorkspaceUtils.createNew());
            router("/list");
        }
    }

    return (
        <>
            <Stack direction="row" spacing={'160px'} className="detail-header">
                <div className="detail-header__left">
                    <h1 className="detail-header__heading">{wsState.title}</h1>
                    <p className="detail-header__text">{wsState.description}</p>
                    <UserAvatarWrap size={40}/>
                </div>
                <div className="detail-header__right">
                    {WorkspaceUtils.hasActiveArea(wsState) ? <p className="detail-header__status -active">稼働中</p> : <p className="detail-header__status -nonactive">停止中</p>}
                    <table className="detail-header__table" aria-label="横浜インナーハーバーの更新日・作成日">
                        <tbody>
                        <tr>
                            <th>更新日</th>
                            <td>
                                <time dateTime="2023-04-17">{getDateString(wsState.modified)}</time>
                            </td>
                        </tr>
                        <tr>
                            <th>作成日</th>
                            <td>
                                <time dateTime="2023-04-17">{getDateString(wsState.created)}</time>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <IconButton
                        className="detail-header__menuButton"
                        id="new-list_menuButton"
                        aria-controls={open ? 'new-list__menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        onClick={handleClick}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Menu
                        className="detail-header__menu"
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
                        <MenuItem onClick={handleEdit}>編集</MenuItem>
                        <MenuItem onClick={handleDeleteOpen}>削除</MenuItem>
                        <MenuItem onClick={handleClose}>共有用のURLをコピー</MenuItem>
                    </Menu>
                </div>
            </Stack>
            <ModalDelete open={deleteOpen} callback={handleDeleteClose} title="ワークスペースの削除" comment={wsState.title} />
        </>
    )
}

export default DetailTop
