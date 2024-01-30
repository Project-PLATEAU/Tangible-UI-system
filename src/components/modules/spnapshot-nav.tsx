import ListItem from "@mui/material/ListItem";
import Button from "@mui/material/Button";
import CropOriginalIcon from "@mui/icons-material/CropOriginal";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import Stack from "@mui/material/Stack";

interface SnapNavProps {
    enable: boolean,
    full: boolean,
    callback?: (event: { type: string, value: boolean }) => void
}

function SnapshotNav(props:SnapNavProps) {

    const snapBtnPressed = () => {
        if(props.callback) {
            props.callback({
                type: "snapshot",
                value: true,
            });
        }
    };

    const fullBtnPressed = (index: number) => {
        if(props.callback) {
            if (index === 0) {
                props.callback({
                    type: "fullscreen",
                    value: true,
                });
            } else {
                props.callback({
                    type: "fullscreen",
                    value: false,
                });
            }
        }
    }

    return (
        <Stack component="ul" direction="row" spacing={'10px'} className="snapshot-nav">
            {props.enable &&
                <ListItem disablePadding className="snapshot-nav__item">
                    <Button variant="contained" startIcon={<CropOriginalIcon />} onClick={snapBtnPressed}>
                        スナップショット作成
                    </Button>
                </ListItem>
            }
            <ListItem disablePadding className="snapshot-nav__item">
                {props.full ?
                    <Button variant="contained" startIcon={<FullscreenIcon />} 
                        onClick={() => fullBtnPressed(0)} >
                        VRモード
                    </Button> :
                    <Button variant="contained" startIcon={<FullscreenExitIcon />}
                        onClick={() => fullBtnPressed(1)} >
                        VRモードをやめる
                    </Button>
                }
            </ListItem>
        </Stack>
    )
}

export default SnapshotNav
