import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

function ModalKey(props:{
    open: boolean,
    value: string,
    callback?: (event: { type: string, value: string }) => void
}) {
    const [openState, setOpenState] = useState(props.open);
    const [fieldValue, setFieldValue] = useState(props.value);


    useEffect(() => {
        setOpenState(props.open);
    }, [props.open])

    const cancelHandler = () => {
        if(props.callback) {
            props.callback({
                type: "cancel",
                value: "",
            });
        }
        setOpenState(false);
    }
    const doneHandler = () => {
        if(props.callback) {
            props.callback({
                type: "done",
                value: fieldValue
            });
        }
        setOpenState(false);
    }

    return (
        <Modal open={openState} onClose={cancelHandler} >
            <Box className="modal -small">
                <h2 className="modal__heading">タンジブルユニット連携キー</h2>
                <Stack spacing={'27px'} className="modal__list">
                    <TextField
                        label="タンジブルユニット連携キー"
                        variant="standard"
                        className="modal__item -small"
                        fullWidth
                        value={fieldValue}
                        onChange={(e) => setFieldValue(e.target.value as string)} />
                </Stack>

                <Stack direction="row" spacing={'15px'} className="modal__button">
                    <Button variant="contained" color="secondary" onClick={doneHandler}>保存</Button>
                    <Button variant="outlined" type="reset" onClick={cancelHandler}>キャンセル</Button>
                </Stack>
            </Box>
        </Modal>
    )
}

export default ModalKey
