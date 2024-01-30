import { useState, useEffect } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";

function ModalDelete(props:{
    open: boolean,
    // closeEvent: React.MouseEventHandler<HTMLButtonElement>,
    comment?: string,
    title: string,
    callback?: (event: { type: string }) => void
}) {
    const comment = props.comment ? props.comment : "対象"
    const [openState, setOpenState] = useState(props.open);

    useEffect(() => {
        setOpenState(props.open);
    }, [props.open])

    const cancelHandler = () => {
        if(props.callback) {
            props.callback({
                type: "cancel"
            });
        }
        setOpenState(false);
    }
    const doneHandler = () => {
        if(props.callback) {
            props.callback({
                type: "done"
            });
        }
        setOpenState(false);
    }

    return (
        <Modal
            open={openState}
            onClose={cancelHandler}
        >
            <Box className="modal -small">
                <h2 className="modal__heading">{props.title}</h2>
                <p className="modal__text">本当に”{comment}”を削除しますか？</p>

                <Stack direction="row" spacing={'15px'} className="modal__button">
                    <Button variant="contained" color="error" onClick={doneHandler}>削除</Button>
                    <Button variant="outlined" type="reset" onClick={cancelHandler}>キャンセル</Button>
                </Stack>
            </Box>
        </Modal>
    )
}

export default ModalDelete
