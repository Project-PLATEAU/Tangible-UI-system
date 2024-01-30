import Box from '@mui/material/Box';
import Button from "@mui/material/Button";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";

import ModalTitleComment from './components/modules/modal-title-comment';
import SpaceItem from './components/modules/space-item'
import {
    createOrUpdateWorkspace,
    getUserID,
    getWorkSpaces,
    getAreasFromWsID,
    getSnapshotsFromWsID
} from "./utils/firebase/firebase";
import { Workspace, WorkspaceAtom, WorkspaceUtils } from "./utils/models/Workspace";

function List() {
    const [workSpaces, setWorkSpaces] = useState<Workspace[]>([]);

    const [wsState, setWSState] = useRecoilState(WorkspaceAtom);
    const router = useNavigate();
    
    useEffect(()=> {
        const uid = getUserID();
        const ws = WorkspaceUtils.createNew();
        if (uid && uid !== "") {
            ws.organizer = uid;
            setWSState(ws);
            loadWS();
        } else {
            router("/login");
        }
    }, []);

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
            router("/new/" + wsID);
            return;
        }
        setWSState(WorkspaceUtils.createNew());
    };


    const loadWS = async () => {
        const ws = await getWorkSpaces();
        const ws2 = await Promise.all(ws.map(async (w: Workspace) => {
            const areas = await getAreasFromWsID(w.id);
            const snaps = await getSnapshotsFromWsID(w.id);
            const nw = { ...w };
            nw.areas = areas;
            nw.snapshots = snaps;
            return nw;
        }))
        setWorkSpaces(ws2);
    };

    return (
        <main className="main">
            <div className="space-header">
                <h1 className="space-header__heading">Work Spaces</h1>
                <p className="space-header__counter">{workSpaces.length} 件のワークスペース</p>
                <Button onClick={() => setTitleOpen(true) } variant="contained" color="primary" className="space-header__button">新規ワークスペース作成</Button>
            </div>

            { workSpaces.length > 0 ? (
                <>
                    <Box component="article" className="space-list">
                        {workSpaces.map((ws: Workspace) => {
                            return <SpaceItem isStatus={true} key={ws.id} workspace={ws}/>
                        })}
                    </Box>
                    {/* <Pagination count={10} color="primary" className="pagination" /> */}
                </>
            ) : (
                <Box component="article" className="space-list">
                    <p className="space-list__empty">ワークスペースがありません。</p>
                </Box>
            )}

            <ModalTitleComment
                open={titleOpen}
                modalTitle="ワークスペースタイトル"
                title={wsState.title}
                comment={wsState.description}
                doneText="作成"
                modalKey="new-workspace"
                callback={modalCallbackWsTitle}/>
        </main>
    )
}

export default List
