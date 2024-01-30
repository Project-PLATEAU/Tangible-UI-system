import { useState, useEffect } from "react";
import { Box, IconButton, Popover, Stack } from '@mui/material';

const boxStyle = {
    width: "16px",
    height: "16px",
    border: 1,
    borderRadius: "6px",
    borderColor: "#999",
    borderStyle:"dotted",
    "&:hover": {
        border: "1px solid #0066ff",
        backgroundColor: "#0066ff"
    }
};

const boxCenter = {
    width: "16px",
    height: "16px",
    border: 0
};

function AreaEdgeSelectMenu (props:{ 
    anchor: null | HTMLElement,
    callback?: (event: {type: string, index: number}) => void
}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    useEffect(() => {
        setAnchorEl(props.anchor);
    }, [props.anchor])

    const cancelHandler = () => {
        setAnchorEl(null);
        if(props.callback) {
            props.callback({
                type: "cancel",
                index: -1,
            });
        }
    };

    const doneHandler = (index: number) => {
        setAnchorEl(null);
        if(props.callback) {
            props.callback({
                type: "done",
                index: index,
            });
        }
    };

    return (
        <Popover
            anchorEl={anchorEl}
            open={open}
            onClose={() => cancelHandler()}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "left",
            }}>
            <Box sx={{p: "4px"}}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <IconButton
                        sx={{...boxStyle, margin: "8px 3px 2px 8px"}}
                        onClick={() => doneHandler(1)}/>
                    <IconButton
                        sx={{...boxStyle, margin: "8px 8px 2px 3px"}}
                        onClick={() => doneHandler(2)}/>
                    <IconButton
                        sx={{...boxStyle, margin: "8px 8px 2px 8px"}}
                        onClick={() => doneHandler(3)}/>
                    <IconButton
                        sx={{...boxStyle, margin: "8px 3px 2px 8px"}}
                        onClick={() => doneHandler(4)}/>
                    <IconButton 
                        sx={{...boxStyle, margin: "8px 8px 2px 3px"}}
                        onClick={() => doneHandler(5)}/>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <IconButton
                        sx={{...boxStyle, margin: "3px 2px 8px 8px"}}
                        onClick={() => doneHandler(6)}/>
                    <Box sx={{
                        borderTop: 2,
                        borderLeft: 2,
                        borderRight: 2,
                        borderTopLeftRadius: "6px",
                        borderTopRightRadius: "6px",
                        borderColor: "#ff6600",
                    }}>
                        <IconButton
                            sx={{...boxStyle, margin: "2px 8px 8px 2px"}}
                            onClick={() => doneHandler(7)}/>
                        <IconButton
                            sx={{...boxStyle, margin: "2px 8px 8px 8px"}}
                            onClick={() => doneHandler(8)}/>
                        <IconButton
                            sx={{...boxStyle, margin: "2px 2px 8px 8px"}}
                            onClick={() => doneHandler(9)}/>
                    </Box>
                    <IconButton
                        sx={{...boxStyle, margin: "3px 8px 8px 2px"}}
                        onClick={() => doneHandler(10)}/>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <IconButton
                        sx={{...boxStyle, margin: "8px 2px 8px 8px"}}
                        onClick={() => doneHandler(11)}/>
                    <Box sx={{borderLeft: 2, borderRight: 2, borderColor: "#ff6600"}}>
                        <IconButton
                            sx={{...boxStyle, margin: "8px 8px 8px 2px"}}
                            onClick={() => doneHandler(12)}/>
                        <IconButton
                            sx={{...boxCenter, m: "9px"}}
                            disabled={true}/>
                        <IconButton
                            sx={{...boxStyle, margin: "8px 2px 8px 8px"}}
                            onClick={() => doneHandler(14)}/>
                    </Box>
                    <IconButton
                        sx={{...boxStyle, margin: "8px 8px 8px 2px"}}
                        onClick={() => doneHandler(15)}/>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <IconButton
                        sx={{...boxStyle, margin: "8px 2px 4px 8px"}}
                        onClick={() => doneHandler(16)}/>
                    <Box sx={{
                        borderBottom: 2,
                        borderLeft: 2,
                        borderRight: 2,
                        borderBottomRightRadius: "6px",
                        borderBottomLeftRadius: "6px",
                        borderColor: "#ff6600",
                    }}>
                        <IconButton
                            sx={{...boxStyle, margin: "8px 8px 2px 2px"}}
                            onClick={() => doneHandler(17)}/>
                        <IconButton
                            sx={{...boxStyle, margin: "8px 8px 2px 8px"}}
                            onClick={() => doneHandler(18)}/>
                        <IconButton
                            sx={{...boxStyle, margin: "8px 2px 2px 8px"}}
                            onClick={() => doneHandler(19)}/>
                    </Box>
                    <IconButton
                        sx={{...boxStyle, margin: "8px 8px 4px 2px"}}
                        onClick={() => doneHandler(20)}/>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <IconButton
                        sx={{...boxStyle, margin: "2px 3px 8px 8px"}}
                        onClick={() => doneHandler(21)}/>
                    <IconButton
                        sx={{...boxStyle, margin: "2px 8px 8px 2px"}}
                        onClick={() => doneHandler(22)}/>
                    <IconButton
                        sx={{...boxStyle, margin: "2px 8px 8px 8px"}}
                        onClick={() => doneHandler(23)}/>
                    <IconButton
                        sx={{...boxStyle, margin: "2px 2px 8px 8px"}}
                        onClick={() => doneHandler(24)}/>
                    <IconButton
                        sx={{...boxStyle, margin: "2px 8px 8px 3px"}}
                        onClick={() => doneHandler(25)}/>
                </Stack>
            </Box>
        </Popover>
    )
}

export default AreaEdgeSelectMenu
