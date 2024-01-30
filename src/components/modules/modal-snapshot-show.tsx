import CropOriginalIcon from "@mui/icons-material/CropOriginal";
import DownloadIcon from '@mui/icons-material/Download';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ListItem from '@mui/material/ListItem';
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";

import ImgSnapshot from "../../images/dummy/dummy_snapshot_large.png";
import { Snapshot } from "../../utils/models/Snapshot";

function ModalSnapshotShow(props:{
    open: boolean,
    snap: Snapshot,
    callback?: (event: { type: string }) => void
}) {

    const closeCallback = () => {
        if (props.callback) {
            props.callback({ type: "close" });
        }
    };

    const viewCallback = () => {
        if (props.callback) {
            props.callback({ type: "view" });
        }
    };

    const dlCallback = () => {
        if (props.callback) {
            props.callback({ type: "download" });
        }
    };

    const deleteCallback = () => {
        if (props.callback) {
            props.callback({ type: "delete" });
        }
    };

    return (
        <Modal open={props.open} onClose={closeCallback}>
            <Box className="modal modal-snapshot-show">
                <figure className="modal__image">
                { props.snap.screenUrl ?
                    <img src={props.snap.screenUrl} alt="" width={1000} height={400} decoding="async" /> :
                    <img src={ImgSnapshot} alt="" width={1000} height={400} decoding="async" />
                }
                </figure>
                <h2 className="modal__heading">{props.snap.title}</h2>
                <Stack direction="row" spacing={'10px'} className="modal-nav" component="ul">
                    <ListItem disablePadding className="modal-nav__item">
                        <Button variant="contained" startIcon={<CropOriginalIcon />} onClick={viewCallback}>
                            ビューワーで表示
                        </Button>
                    </ListItem>
                    <ListItem disablePadding className="modal-nav__item">
                        <Button variant="contained" startIcon={<DownloadIcon />} onClick={dlCallback}>
                            ダウンロード
                        </Button>
                    </ListItem>
                </Stack>

                <p className="modal__text -fat">{props.snap.comment}</p>

                <Stack direction="row" spacing={'15px'} className="modal__button">
                    <Button variant="contained" color="secondary" onClick={closeCallback}>閉じる</Button>
                    <Button variant="contained" color="error" onClick={deleteCallback}>削除</Button>
                </Stack>
            </Box>
        </Modal>
    )
}

export default ModalSnapshotShow
