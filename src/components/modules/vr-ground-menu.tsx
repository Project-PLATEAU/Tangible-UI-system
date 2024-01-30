import MenuIcon from '@mui/icons-material/Menu';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from '@mui/material/FormControlLabel';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';

import { useState } from "react";
import { useRecoilState } from "recoil";

import { VRAtom } from '../../utils/AppUtils';

const groundTypes= [
    { type: 0, text: "国土地理院地図" },
    { type: 1, text: "土" },
    { type: 2, text: "芝生" },
    { type: 3, text: "ウッド" },
    { type: 4, text: "Unity画像" },
    { type: 5, text: "灰色塗りつぶし" },
];


function VRGroundMenu(props:{ 
    callback?: (event: { type: string, value: number }) => void
}) {
    const [vrState, setVRState] = useRecoilState(VRAtom);
    const [listAnchorEl, setListAnchorEl] = useState<null | HTMLElement>(null);
    const listOpen = Boolean(listAnchorEl);
    const listOpenClick = (event: React.MouseEvent<HTMLElement>) => {
        setListAnchorEl(event.currentTarget);
    };

    const listCloseClick = (n: number) => {
        setListAnchorEl(null);
        if (n < 0) {
            return;
        }
        setVRState({
            ground: n,
            focus: vrState.focus,
            lod1: vrState.lod1,
        })
        if(props.callback) {
            props.callback({
                type: "selected",
                value: n,
            })
        }
    };

    const listCancelClick = () => {
        setListAnchorEl(null);
        cancelHandler();
    };

    const cancelHandler = () => {
        if(props.callback) {
            props.callback({
                type: "cancel",
                value: 0,
            })
        }
    };

    const lod1Switch = () => {
        setVRState({
            ground: vrState.ground,
            focus: vrState.focus,
            lod1: !vrState.lod1,
        })
    }

    return (
        <Box sx={{position:'absolute', top: '0px', right: '360px', m: '20px'}} >
            <FormControlLabel
                className="snapshot-nav__switch-label"
                value="end"
                label="LOD1"
                color='success'
                control={
                    <Switch
                        className="snapshot-nav__switch"
                        color='success'
                        checked={vrState.lod1}
                        onChange={lod1Switch}/>
                }
            />
            <Button
                className="snapshot-nav__item"
                id="ground-list_menuButton"
                aria-controls={listOpen ? "ground-list__menu" : undefined}
                aria-haspopup="true"
                aria-expanded={listOpen ? "true" : undefined}
                onClick={listOpenClick}
                variant="contained"
                color="success"
                startIcon={<MenuIcon sx={{mr: "8px"}}/>}
            >
                地表描画
            </Button>
            <Menu
                className="new-list__menu"
                aria-labelledby="ground-list_menuButton"
                anchorEl={listAnchorEl}
                open={listOpen}
                onClose={() => listCancelClick()}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                }}
            >
                <MenuItem color="variant" onClick={() => listCloseClick(-1)}>{groundTypes[vrState.ground].text}</MenuItem>
                <MenuItem onClick={() => listCloseClick(0)}>{groundTypes[0].text}</MenuItem>
                <MenuItem onClick={() => listCloseClick(1)}>{groundTypes[1].text}</MenuItem>
                <MenuItem onClick={() => listCloseClick(2)}>{groundTypes[2].text}</MenuItem>
                <MenuItem onClick={() => listCloseClick(3)}>{groundTypes[3].text}</MenuItem>
                <MenuItem onClick={() => listCloseClick(4)}>{groundTypes[4].text}</MenuItem>
                <MenuItem onClick={() => listCloseClick(5)}>{groundTypes[5].text}</MenuItem>
            </Menu>
        </Box>
    )
}

export default VRGroundMenu
