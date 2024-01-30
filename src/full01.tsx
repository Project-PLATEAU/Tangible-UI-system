import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { useRecoilState } from "recoil";

import MapS from './components/modules/map-small';
import ModalSnapshotMake from "./components/modules/modal-snapshot-make";
import SnapshotNav from "./components/modules/spnapshot-nav";
import VRGroundMenu from "./components/modules/vr-ground-menu";
import VRView, { VRCallback } from "./components/modules/vr-view";

import { VRAtom } from './utils/AppUtils';
import { saveSnapShot } from "./utils/firebase/firebase";
import { Area } from './utils/models/Area';
import { TangibleMarker } from './utils/models/Marker';
import { PhotoUtils } from './utils/models/Photo';
import { SnapshotUtils, Snapshot } from './utils/models/Snapshot';
import { WorkspaceAtom, Workspace, WorkspaceUtils } from "./utils/models/Workspace";

function Full01() {
    const {id} = useParams();
    const [wsState, setWSState] = useRecoilState(WorkspaceAtom);
    const [vrState, setVRState] = useRecoilState(VRAtom);
    const [prepared, setPrepared] = useState(false);
    const [progress, setProgress] = useState(false);
    const [upAreas, setUpAreas] = useState([] as Area[]);
    const router = useNavigate();
    const [pause, setPause] = useState(true);
    const [snapC, setSnapC] = useState({
        position: { lat: 0, lng: 0, alt: 0},
        target: { lat: 0, lng: 0, alt: 0}
    })
    const [pauseC, setPauseC] = useState({
        position: { lat: 0, lng: 0, alt: 0},
        target: { lat: 0, lng: 0, alt: 0}
    });

    const pauseRef = useRef<boolean>();
    const [clock, setClock] = useState(Math.random);

    useEffect(() => {
        console.log(id);
        if (id === undefined || id === null) {
            router("/list");
        } else {
            if (prepared) {
                // setUpAreas(wsState.areas);
                // poring();
            } else {
                loadWorkSpace(id);
            }
        }
    }, [prepared]);

    useEffect(() => {
        const timeoutId = setInterval(() => {
            setClock(Math.random());
        }, 1000);
        return () => {
            clearTimeout(timeoutId);
        };
    }, [])

    useEffect(() => {
        pauseRef.current = pause;
    }, [pause]);

    useEffect(() => {
        console.log("pause " + pause + ', ' + pauseRef.current);
        if (!pause) {
            poring();
        }
    }, [clock]);

    // 1. 全エリアの範囲内にいる建物（あるいは道路も？）情報取得
    // 2. 全エリアが所有するマーカー情報取得（リアルタイムのではない）
    // 3. 最新のsnapshotのマーカー情報取得
    const loadWorkSpace = async(id: string) => {
        const ws = await WorkspaceUtils.loadWorkSpaceWithId(id);
        if (ws) {
            const ws1 = await WorkspaceUtils.loadAreasBuildings(ws);
            const ws2 = await WorkspaceUtils.loadAreaWithMarkerObj(ws1);
            if (ws2.snapshots.length > 0) {
                const snap = await SnapshotUtils.loadDetail(ws2, ws2.snapshots[0]);
                setSnapC(snap.camera);
                pickUpTangibleMarkers(ws2, snap);
                setWSState(ws2);
            } else {
                setWSState(ws2);
            }
            setPrepared(true);
            setPause(false);
        } else {
            router("/list");
        }
    };

    const pickUpTangibleMarkers = (ws: Workspace, snap: Snapshot) => {
        for (const area of ws.areas) {
            const sArea = snap.areas.find((sa: Area) => {
                return area.id === sa.id;
            });
            if (sArea) {
                for (const marker of area.markers) {
                    const tM = sArea.tMarkers.find((tm: TangibleMarker) => {
                        return marker.uniqueID === tm.uniqueID;
                    })
                    if (tM) {
                        area.tMarkers.push(tM);
                    }
                }
            }
        }
    }

    // 4. 稼働中tangibleのマーカー情報取得
    const poring = async () => {
        if (pauseRef.current) {
            return;
        }
        setPause(true);
        const result = await WorkspaceUtils.checkTangibleUpdates(wsState);
        setWSState(result.workspace);
        setUpAreas(result.updateAreas);
        setPause(false);
    }

    const visible = () => {
        return prepared && !wsState.isNew;
    };

    const [takeSnap, setTakeSnap] = useState(false);
    const snapNavCallback = (e: {type: string, value: boolean}) => {
        if (e.type === "fullscreen") {
            if (e.value === false) {
                router("/detail/" + id);
            }
        } else if (e.type === "snapshot") {
            setPause(true);
            setTakeSnap(true);
        } 
    };

    const [snapConfirmOpen, setSnapConfirmOpen] = useState(false);
    const [imgBlob, setImgBlob] = useState<Blob | null>(null);
    const [imgBase64, setImgBase64] = useState("");
    const vrViewCallback = (e: VRCallback) => {
        if (e.type === "initialized") {
            console.log('initialized');
            if (wsState.snapshots.length > 0) {
                setSnapC({ ...snapC });
            }
            setUpAreas(wsState.areas);
            setPause(false);
        }
        setTakeSnap(false);
        if (e.type === "snapshot") {
            if (e.mode === 2 && e.body) { 
                setPauseC(e.body.camera);
                setImgBlob(e.body.blob);
                setImgBase64(e.body.base64);
                setSnapConfirmOpen(true);
            }
        }
    };
    const snapConfirmCallback = (e: {type: string, title: string, comment: string}) => {
        if (e.type === "snapshotmake") {
            if (imgBlob) {
                save(e.title, e.comment, imgBlob);
            }
            setSnapConfirmOpen(false);
            setImgBase64("");
        } else {
            setSnapConfirmOpen(false);
            setImgBase64("");
            setImgBlob(null);
            setPause(false);
        }
    }

    const save = async (title: string, comment: string, blob: Blob) => {
        setProgress(true);
        const snap = SnapshotUtils.createSnapShotFromWorkspace(wsState, pauseC);
        const docID = PhotoUtils.makeDateIDString(new Date(), "-");
        const fName = await SnapshotUtils.uploadScreenImage(wsState.id, blob, docID);
        if (fName) {
            snap.id = docID;
            snap.screenshot = fName;
            snap.title = title;
            snap.comment = comment;
            const res = await saveSnapShot(wsState.id, snap);
            console.log(res);
        }
        setProgress(false);
        setPause(false);
        setImgBlob(null);
    }

    const mapCallback = (e: {type: string, area: Area}) => {
        setVRState({
            ground: vrState.ground,
            focus: e.area.id,
            lod1: vrState.lod1,
        });
    };

    return (
        <>
            <main className="main -full">
                <Box component="article" className="full">
                    <h1 className="full__heading -hide">山下公園からの眺望</h1>
                    <Box sx={{ position: "relative", width: "100%", height: "100%"}}>
                        <Box className="full__ar">
                            {visible() &&
                            <VRView ws={wsState} upAreas={upAreas} camera={snapC} take={takeSnap} callback={vrViewCallback}/>}
                        </Box>
                        <Box className="full__map">
                            <MapS areas={wsState.areas} callback={mapCallback} selectable={true}/>
                        </Box>
                        <VRGroundMenu />
                    </Box>
                    <SnapshotNav enable={true} full={false} callback={snapNavCallback}/>
                </Box>
            </main>
            <ModalSnapshotMake open={snapConfirmOpen} base64={imgBase64} callback={snapConfirmCallback}/>
            <Backdrop open={progress} sx={{ p: '12px' }}>
                <CircularProgress color="success" />
            </Backdrop>
        </>
    )
}

export default Full01
