import { useState } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CropOriginalIcon from "@mui/icons-material/CropOriginal";
import Modal from "@mui/material/Modal";

function ModalSnapshotMake(props:{ 
    open: boolean,
    base64: string,
    callback?: (event: {type: string, title: string, comment: string}) => void
}) {
    const [comment, setComment] = useState("");
    const [title, setTitle] = useState("");

    const modalClose = () => {
        if (props.callback) {
            props.callback({
                type: "cancel",
                title: "",
                comment: "",
            });
        }
    };

    const modalSave = () => {
        if (props.callback) {
            props.callback({
                type: "snapshotmake",
                title: title,
                comment: comment,
            });
        }
    };

    const formChange = (type: string, value: string) => {
        if (type === "title") {
            setTitle(value);
        } else if (type === "comment") {
            setComment(value);
        }
    };

    return (
        <Modal open={props.open} onClose={modalClose}>
            <Box className="modal">
                <h2 className="modal__heading">
                    <CropOriginalIcon className="icon" />
                    スナップショット作成
                </h2>
                <div className="modal__image ">
                <img src={props.base64} alt="" />
                </div>
                <Stack spacing={'27px'} className="modal__list">
                    <TextField
                        label="タイトル"
                        variant="outlined"
                        className="modal__item -large"
                        value={title}
                        onChange={(e) => formChange("title", e.target.value)}
                        fullWidth />
                    <TextField
                        label="コメント"
                        multiline
                        rows={7}
                        value={comment}
                        onChange={(e) => formChange("comment", e.target.value)}
                        className="modal__item"
                        fullWidth
                    />
                </Stack>

                <Stack direction="row" spacing={'15px'} className="modal__button">
                    <Button variant="contained" color="secondary" onClick={modalSave}>保存</Button>
                    <Button variant="outlined" type="reset" onClick={modalClose}>キャンセル</Button>
                </Stack>
            </Box>
        </Modal>
    )
}

export default ModalSnapshotMake
