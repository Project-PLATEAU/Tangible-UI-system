import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { useRecoilState } from "recoil";


import Box from '@mui/material/Box';
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import Detailtop from "./components/modules/detail-top";
import { WorkspaceAtom, WorkspaceUtils } from "./utils/models/Workspace";
import DetailMaps from "./components/modules/detail-maps";
import DetailSnapshot from "./components/modules/detail-snapshot";
import DetailMarkerWrap from "./components/modules/detail-marker-wrap";

function Detail() {
    const {id} = useParams();
    const [wsState, setWSState] = useRecoilState(WorkspaceAtom);
    const [prepared, setPrepared] = useState(false);
    const router = useNavigate();

    useEffect(() => {
        console.log(id);
        if (id === undefined || id === null) {
            router("/list");
        } else {
            loadWorkSpace(id);
        }
    }, []);

    const loadWorkSpace = async(id: string) => {
        const ws = await WorkspaceUtils.loadWorkSpaceWithId(id);
        if (ws) {
            const ws1 = await WorkspaceUtils.loadAreaWithMarkerObj(ws);
            setWSState(ws1);
            setPrepared(true);
        } else {
            router("/list");
        }
    };

    const visible = () => {
        return prepared && !wsState.isNew;
    };

    const pageCancelClicked = () => {
        router("/list");
    };

    const snapCallback = (e: {type: string}) => {
        if (e.type === "reload") {
            loadWorkSpace(wsState.id);
        }
    }

    return (
        <main className="main">
            <Stack direction="row" spacing={'15px'} className="new-button">
                <Button variant="outlined" onClick={pageCancelClicked}>一覧へ戻る</Button>
            </Stack>
            {visible() && (
                <Box component="article" className="detail">
                    <Detailtop />
                    {wsState.areas.length === 0 ?
                    <p className="detail-sec__empty">検討エリアがありません。</p> :
                    <>
                        <DetailMaps />
                        <DetailSnapshot callback={snapCallback}/>
                        <DetailMarkerWrap />
                    </>
                    }
                </Box>
            )}
        </main>
    )
}

export default Detail
