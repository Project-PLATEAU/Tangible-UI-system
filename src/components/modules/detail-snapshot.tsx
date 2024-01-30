import { Box, Backdrop, CircularProgress } from "@mui/material";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";

import ModalDelete from "./modal-delete";
import ModalSnapshotShow from "./modal-snapshot-show";
import snapshotImage from "../../images/dummy/dummy_snapshot_small.png";

import { Snapshot, SnapshotUtils } from "../../utils/models/Snapshot";
import { WorkspaceAtom } from "../../utils/models/Workspace";
import { getDateString } from "../../utils/UserUtils";
import { deleteSnapShot } from "../../utils/firebase/firebase";

function Item(props: {
    wsID: string
    snap: Snapshot
    callback?: (event: { snap: Snapshot }) => void
}) {
    const [snap, setSnap] = useState<Snapshot>(SnapshotUtils.createBlank());
    useEffect(() => {
        loadObject();
    }, [props.snap])

    const loadObject = async () => {
        const s2 = snap.id === "blank" ? props.snap : snap; 
        const url = await SnapshotUtils.loadThumbUrl(props.wsID, s2);
        const s3 = { ...s2 };
        s3.screenUrl = url;
        setSnap(s3);
    };

    const onClickItem = () => {
        if (props.callback) {
            props.callback({
                snap: snap,
            });
        }
    };

    return (
        <a className="detail-snapshot__item" onClick={() => onClickItem()}>
            <figure className="detail-snapshot__image">
                { snap.screenUrl ?
                <img src={snap.screenUrl} alt="" width={320} height={180} decoding="async" /> :
                <img src={snapshotImage} alt="" width={320} height={180} decoding="async" />
                }
            </figure>
            <dl className="detail-snapshot__content">
                <dt className="detail-snapshot__heading">{snap.title}</dt>
                <dd>
                    <time dateTime="2023-04-17" className="detail-snapshot__date">{getDateString(snap.created)}</time>
                    <p className="detail-snapshot__text">{snap.comment}</p>
                </dd>
            </dl>
        </a>
    )
}

function DetailSnapshot(props: { callback?: (event: { type: string }) => void }) {
    const [open, setOpen] = useState(false);
    const [delOpen, setDelOpen] = useState(false);
    const [progress, setProgress] = useState(false);
    const router = useNavigate();
    const wsState = useRecoilValue(WorkspaceAtom);
    const [selSnap, setSelSnap] = useState<Snapshot>(SnapshotUtils.createBlank());

    const itemCallback = (e: { snap: Snapshot }) => {
        const snap: Snapshot = e.snap;
        setSelSnap(snap);
        setOpen(true);
    }

    const modalCallback = (e: { type: string }) => {
        if(e.type === "view") {
            router("/full02/" + wsState.id + "/" + selSnap.id);
        } else if (e.type === "download") {
            if (selSnap.screenUrl) {
                const link = document.createElement("a");
                link.href = selSnap.screenUrl;
                link.download = selSnap.screenshot;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            setSelSnap(SnapshotUtils.createBlank());
        } else if (e.type === "delete") {
            setDelOpen(true);
        }
        setOpen(false);
    };

    const modalDeleteCallback = async (e: { type: string }) => {
        if(e.type === "done") {
            setProgress(true);
            await deleteSnapShot(wsState, selSnap);
            if (props.callback) {
                props.callback({ type: "reload" });
            }
        }
        setDelOpen(false);
        setProgress(false);
        setSelSnap(SnapshotUtils.createBlank());
    };

    return (
        <section className="detail-sec">
            <h2 className="detail-sec__heading">Snapshots</h2>
            {
                wsState.snapshots.length === 0 ? 
                <p className="detail-sec__empty">スナップショットがありません。</p> : 
                <Box className="detail-snapshot">{
                    wsState.snapshots.map((snap: Snapshot) => {
                        return <Item key={snap.id} wsID={wsState.id} snap={snap} callback={itemCallback}/>
                    })}
                </Box>
            }
            <ModalSnapshotShow open={open} snap={selSnap} callback={modalCallback} />
            <ModalDelete open={delOpen} title="スナップショットの削除" comment={selSnap.title} callback={modalDeleteCallback} />
            <Backdrop open={progress}>
                <CircularProgress color="primary"/>
            </Backdrop>
        </section>
    )
}

export default DetailSnapshot
