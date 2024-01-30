import { useState, useEffect } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";



function ModalTitleComment(props:{ 
    open: boolean,
    modalTitle: string,
    modalKey: string,
    title: string,
    comment: string,
    doneText?: string,
    callback?: (event: {type: string, title: string, comment: string, key: string}) => void
}) {
    const [openState, setOpenState] = useState(props.open)
    const [comment, setComment] = useState(props.comment);
    const [title, setTitle] = useState(props.title);

    useEffect(() => {
        setOpenState(props.open)
        if (props.open) {
            setComment(props.comment);
            setTitle(props.title);
        }
    }, [props.open])

    const cancelHandler = () => {
        if(props.callback) {
            props.callback({
                type: "cancel",
                title: "",
                comment: "",
                key: props.modalKey
            })
        }
        setOpenState(false)
    }

    const formChange = (type: string, value: string) => {
        if (type === "title") {
            setTitle(value);
        } else if (type === "comment") {
            setComment(value);
        }
    };

    const doneHandler = () => {
        if(props.callback) {
            props.callback({
                type: "done",
                title: title,
                comment: comment,
                key: props.modalKey
            })
        }
        setOpenState(false)
    }

    return (
        <Modal
            open={openState}
            onClose={cancelHandler}
        >
            <Box className="modal -small">
                <h2 className="modal__heading">{ props.modalTitle }</h2>
                <Stack spacing={'27px'} className="modal__list">
                    <TextField
                        label="タイトル"
                        variant="standard"
                        className="modal__item -small"
                        fullWidth
                        value={title}
                        onChange={(e) => formChange("title", e.target.value)} />
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
                <Stack direction="row" spacing={"15px"} className="modal__button">
                    <Button variant="contained" color="secondary" onClick={doneHandler}>{ props.doneText ?? "OK" }</Button>
                    <Button variant="outlined" type="reset" onClick={cancelHandler}>キャンセル</Button>
                </Stack>
            </Box>
        </Modal>
    )
}

export default ModalTitleComment
