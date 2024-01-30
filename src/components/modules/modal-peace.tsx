import React, { useState, useEffect } from 'react'
import BedroomBabyOutlinedIcon from "@mui/icons-material/BedroomBabyOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from '@mui/material/Modal';
import Stack from "@mui/material/Stack";
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import ModalPeaceMap from './modal-peace-map';
import ModalPeaceStreet from "./modal-peace-street";

import { getAllFurnitures } from '../../utils/firebase/firebase';
import { Area, AreaUtils } from '../../utils/models/Area';
import { Building } from '../../utils/models/Building';
import { Furniture, SpecialFrn, SFrnUtils } from '../../utils/models/Furniture';
import { MarkerUtils, Marker } from '../../utils/models/Marker';
import ModalPeaceSpecial from './modal-peace-special';

interface TabPanelProps {
    children: JSX.Element;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tab-panel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box>{children}</Box>
            )}
        </div>
    );
}

function ModalPeace(props:{
    open: boolean,
    area: Area,
    callback?: (event: { type: string, area?: Area }) => void
}) {
    const [value, setValue] = React.useState(0);
    const [openState, setOpenState] = useState(props.open);
    const [area, setArea] = useState<Area>(props.area);
    const [bldgs, setBldgs] = useState<Building[]>(props.area.bldgs ? props.area.bldgs : []);
    const [frns, setFrns] = useState<Furniture[]>([]);
    const [sFrns, setSFrns] = useState<SpecialFrn[]>([]);

    useEffect(() => {
        setOpenState(props.open);
        if (props.open) {
            loadUnits(area);
        }
    }, [props.open])

    useEffect(() => {
        setArea(props.area);
    }, [props.area])

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
                type: "done",
                area: area,
            });
        }
        setOpenState(false);
    }

    const loadUnits = async (tArea: Area) => {
        await loadBuildings(tArea);
        await loadFurnitures();
        setSFrns(SFrnUtils.loadSpecialFrns());
    }

    const loadBuildings = async (tArea: Area) => {
        const nA = await AreaUtils.loadBuildings(tArea);
        if (nA.bldgs) {
            console.log("bldgs: " + nA.bldgs.length);
            setBldgs(nA.bldgs);
        }
    }

    const loadFurnitures = async () => {
        const newFrns = await getAllFurnitures();
        console.log("frns: " + newFrns.length);
        setFrns(newFrns);
    }

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const markerChangeCallback = (e: {type: string, markers: Marker[]}) => {
        if (e.type === "marker") {
            const nArea = { ...area }
            nArea.markers = e.markers;
            setArea(nArea);
        }
    }
    
    return (
        <Modal open={openState} onClose={cancelHandler} >
            <Box className="modal modal-peace">
                <h2 className="modal__heading">
                    <BedroomBabyOutlinedIcon className="icon" />
                    { area.title } タンジブル駒の設定
                </h2>
                <p className="modal__counter">{ MarkerUtils.countMarkers(area.markers) } / 99</p>
                <Box className="modal-peace__tab">
                    <Tabs value={value} onChange={handleChange} aria-label="“みなとみらいエリア” タンジブル駒の設定" centered className="modal-peace__tabList">
                        <Tab
                            label="ストリートファニチャー"
                            id="tab-0"
                            aria-controls="tab-panel-0"
                            className="modal-peace__tabItem" />
                        <Tab
                            label="建物(LOD1)"
                            id="tab-1"
                            aria-controls="tab-panel-1"
                            className="modal-peace__tabItem" />
                        <Tab
                            label="特殊"
                            id="tab-2"
                            aria-controls="tab-panel-2"
                            className="modal-peace__tabItem" />
                    </Tabs>
                    <TabPanel value={value} index={0}>
                        <ModalPeaceStreet
                            area={area}
                            frns={frns}
                            callback={markerChangeCallback}/>
                    </TabPanel>
                    <TabPanel value={value} index={1}>
                        <div className="modal-peace__map">
                            <ModalPeaceMap
                                area={area}
                                bldgs={bldgs}
                                callback={markerChangeCallback} />
                        </div>
                    </TabPanel>
                    <TabPanel value={value} index={2}>
                        <ModalPeaceSpecial
                            area={area}
                            sFrns={sFrns}
                            callback={markerChangeCallback} />
                    </TabPanel>
                </Box>

                <Stack direction="row" spacing={'15px'} className="modal__button">
                    <Button variant="contained" color="secondary" onClick={doneHandler}>保存</Button>
                    <Button variant="outlined" type="reset" onClick={cancelHandler}>キャンセル</Button>
                </Stack>
            </Box>
        </Modal>
    )
}

export default ModalPeace
