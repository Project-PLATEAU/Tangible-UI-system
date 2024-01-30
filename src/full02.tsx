// import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box';
// import CircularProgress from '@mui/material/CircularProgress';


import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from 'react-router-dom';

import MapS from './components/modules/map-small';
import SnapshotNav from "./components/modules/spnapshot-nav";
import VRGroundMenu from "./components/modules/vr-ground-menu";
import VRView, { VRCallback } from "./components/modules/vr-view";

import { Area } from './utils/models/Area';
import { SnapshotUtils, Snapshot } from './utils/models/Snapshot';
import { Workspace, WorkspaceUtils } from "./utils/models/Workspace";

function Full02() {
    const {id, snapId} = useParams();
    const [wsState, setWSState] = useState<Workspace>(WorkspaceUtils.createNew());
    const [prepared, setPrepared] = useState(false);
    const [upAreas, setUpAreas] = useState([] as Area[]);
    const router = useNavigate();
    const [pause, setPause] = useState(true);
    const [snapC, setSnapC] = useState({
        position: { lat: 0, lng: 0, alt: 0},
        target: { lat: 0, lng: 0, alt: 0}
    })

    const pauseRef = useRef<boolean>();
    useEffect(() => {
        console.log("Full02/" + id + "/" + snapId);
        console.log(id);
        if (id === undefined || id === null) {
            router("/list");
        } else {
            if (!prepared) {
                loadWorkSpace(id);
            }
        }
    }, [prepared]);

    useEffect(() => {
        pauseRef.current = pause;
    }, [pause]);

    // 1. 全エリアの範囲内にいる建物（あるいは道路も？）情報取得
    // 2. 全エリアが所有するマーカー情報取得（リアルタイムのではない）
    // 3. 最新のsnapshotのマーカー情報取得
    const loadWorkSpace = async(id: string) => {
        console.log("loadWorkSpace");
        const ws = await WorkspaceUtils.loadWorkSpaceWithId(id);
        if (ws) {
            if (ws.snapshots.length === 0) {
                router("/list");
                return;
            }
            let snap: Snapshot = ws.snapshots[0];
            const fSnap = SnapshotUtils.findSnapShot(ws, snapId);
            if (fSnap) {
                snap = fSnap;
            }
            const snap2 = await SnapshotUtils.loadDetail(ws, snap);
            const snap3 = await SnapshotUtils.loadAreasBuildings(snap2);
            const snap4 = SnapshotUtils.setDummyActiveTangible(snap3);
            console.log(snap3);
            setSnapC(snap4.camera);
            const ws1 = { ...ws };
            ws1.areas = snap4.areas;
            setWSState(ws1);
            setPrepared(true);
            setPause(false);
        } else {
            router("/list");
        }
    };


    // 4. 稼働中tangibleのマーカー情報取得
    // const poring = async () => {
    //     // wsState.areas.map
    //     // console.log("poring " + pause + ', ' + pauseRef.current);
    //     if (pauseRef.current) {
    //         return;
    //     }
    //     const result = await WorkspaceUtils.checkTangibleUpdates(wsState);
    //     console.log(result);
    //     setWSState(result.workspace);
    //     setUpAreas(result.updateAreas);
    // }

    const visible = () => {
        return prepared && !wsState.isNew;
    };

    const [takeSnap, setTakeSnap] = useState(false);
    const snapNavCallback = (e: {type: string, value: boolean}) => {
        if (e.type === "fullscreen") {
            if (e.value === false) {
                router("/detail/" + id);
            }
        }
    };

    // const [snapConfirmOpen, setSnapConfirmOpen] = useState(false);
    // const [imgBlob, setImgBlob] = useState<Blob | null>(null);
    // const [imgBase64, setImgBase64] = useState("");
    const vrViewCallback = (e: VRCallback) => {
        if (e.type === "initialized") {
            console.log('initialized');
            setSnapC({ ...snapC });
            console.log(wsState.areas);
            setUpAreas(wsState.areas);
            setPause(false);
        }
        setTakeSnap(false);
        if (e.type === "snapshot") {
            if (e.mode === 2 && e.body) { 
                // setPauseC(e.body.camera);
                // setImgBlob(e.body.blob);
                // setImgBase64(e.body.base64);
                // setSnapConfirmOpen(true);
            }
        }
    };
    // const snapConfirmCallback = (e: {type: string, title: string, comment: string}) => {
    //     if (e.type === "snapshotmake") {
    //         if (imgBlob) {
    //             save(e.title, e.comment, imgBlob);
    //         }
    //         setSnapConfirmOpen(false);
    //         setImgBase64("");
    //     }
    // }

    // const save = async (title: string, comment: string, blob: Blob) => {
    //     setProgress(true);
    //     const snap = SnapshotUtils.createSnapShotFromWorkspace(wsState, pauseC);
    //     const docID = PhotoUtils.makeDateIDString(new Date(), "-");
    //     const fName = await SnapshotUtils.uploadScreenImage(wsState.id, blob, docID);
    //     if (fName) {
    //         snap.id = docID;
    //         snap.screenshot = fName;
    //         snap.title = title;
    //         snap.comment = comment;
    //         const res = await saveSnapShot(wsState.id, snap);
    //         console.log(res);
    //     }
    //     setProgress(false);
    //     setPause(false);
    // }

    return (
        <>
            <main className="main -full">
                <Box component="article" className="full">
                    <Box sx={{ position: "relative", width: "100%", height: "100%"}}>
                        <Box className="full__ar">
                            {visible() &&
                            <VRView ws={wsState} upAreas={upAreas} camera={snapC} take={takeSnap} callback={vrViewCallback}/>}
                        </Box>
                        <Box className="full__map">
                            <MapS areas={wsState.areas}  selectable={true}/>
                        </Box>
                        <VRGroundMenu />
                    </Box>
                    <SnapshotNav enable={false} full={false} callback={snapNavCallback}/>
                </Box>
            </main>
            {/* <ModalSnapshotMake open={snapConfirmOpen} base64={imgBase64} callback={snapConfirmCallback}/>
            <Backdrop open={progress} sx={{ p: '12px' }}>
                <CircularProgress color="success" />
            </Backdrop> */}
        </>
    )
}

export default Full02
