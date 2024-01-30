import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState, useEffect } from "react";

function ModalTitle(props:{ 
    open: boolean,
    modalTitle: string,
    modalKey: string,
    value: string,
    doneText?: string,
    callback?: (event: {type: string, value: string, key: string}) => void
}) {
    const [fieldValue, setFieldValue] = useState(props.value)
    const [openState, setOpenState] = useState(props.open)

    useEffect(() => {
        setOpenState(props.open)
        if (props.open) {
            setFieldValue(props.value);
        }
    }, [props.open])

    const cancelHandler = () => {
        if(props.callback) {
            props.callback({
                type: "cancel",
                key: props.modalKey,
                value: "",
            })
        }
        setOpenState(false)
    }

    const doneHandler = () => {
        if(props.callback) {
            props.callback({
                type: "done",
                value: fieldValue,
                key: props.modalKey
            })
        }
        setOpenState(false)
    }

    const checkEnter = (key: string) => {
        if (key.toLowerCase() === "enter") {
            doneHandler();
        }
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
                        variant="standard"
                        className="modal__item -small"
                        fullWidth
                        value={fieldValue}
                        onKeyDown={(e) => checkEnter(e.key)}
                        onChange={(e) => setFieldValue(e.target.value)} />
                </Stack>
                <Stack direction="row" spacing={"15px"} className="modal__button">
                    <Button variant="contained" color="secondary" onClick={doneHandler}>{ props.doneText ?? "OK" }</Button>
                    <Button variant="outlined" type="reset" onClick={cancelHandler}>キャンセル</Button>
                </Stack>
            </Box>
        </Modal>
    )
}

export default ModalTitle
