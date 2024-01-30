import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import { Box, Typography, Tab, Tabs } from "@mui/material";

import { useEffect, useState } from "react";

import DetailMarkerItem from "./detail-marker-item";
import { Area } from "../../utils/models/Area";
import { GoogleMapUtils } from "../../utils/GeoUtils";
import { Marker, MarkerType } from "../../utils/models/Marker";

interface TabPanelProps {
    children: JSX.Element;
    index: number;
    value: number;
    group: string;
}

interface TabElementProps {
    label: string;
    group: string;
    area: Area;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, group, ...other } = props;

    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`tab-panel-${group}-${index}`}
            aria-labelledby={`tab-${group}-${index}`}
            {...other}
        >
            {value === index && (
                <Box>{children}</Box>
            )}
        </Box>
    );
}

function a11yProps(group:string, index: number) {
    return {
        id: `tab-${group}-${index}`,
        'aria-controls': `tab-panel-${group}-${index}`,
    };
}


function TabElement(props: TabElementProps) {
    const [value, setValue] = useState(0);
    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const [frns, setFrns] = useState<Marker[]>([]);
    const [bldgs, setBldgs] = useState<Marker[]>([]);
    const [sFrns, setSFrns] = useState<Marker[]>([]);

    useEffect(() => {
        const fs = props.area.markers.filter((m: Marker) => {
            return m.type === MarkerType.Furniture;
        });
        const bs = props.area.markers.filter((m: Marker) => {
            return m.type === MarkerType.Building;
        });
        const sfs = props.area.markers.filter((m: Marker) => {
            return m.type === MarkerType.Special;
        });
        setFrns(fs);
        setBldgs(bs);
        setSFrns(sfs);
    }, [])


    return (
        <Box className="detail-tab">
            <Tabs value={value} onChange={handleChange} aria-label={props.label} className="detail-tab__list">
                <Tab label="ストリートファニチャー" {...a11yProps(props.group, 0)} className="detail-tab__item" />
                <Tab label="建物" {...a11yProps(props.group, 1)} className="detail-tab__item" />
                <Tab label="特殊" {...a11yProps(props.group, 2)} className="detail-tab__item" />
            </Tabs>
            <TabPanel value={value} index={0} group={props.group}>
                <Box className="detail-street">
                    {frns.map((m: Marker) => {
                        return (
                            <Box className="detail-street__item" key={m.docID}>
                                <DetailMarkerItem marker={m}/>
                            </Box>
                        )
                    })}
                </Box>
            </TabPanel>
            <TabPanel value={value} index={1} group={props.group}>
                <Box className="detail-street">
                    {bldgs.map((m: Marker) => {
                        return (
                            <Box className="detail-street__item" key={m.docID}>
                                <DetailMarkerItem marker={m}/>
                            </Box>
                        )
                    })}
               </Box>
            </TabPanel>
            <TabPanel value={value} index={2} group={props.group}>
                <Box className="detail-street">
                    {sFrns.map((m: Marker) => {
                        return (
                            <Box className="detail-street__item" key={m.docID}>
                                <DetailMarkerItem marker={m}/>
                            </Box>
                        )
                    })}
               </Box>
            </TabPanel>
        </Box>
    );
}

function DetailMarkerList(props: {area: Area}) {
    return (
        <>
            <Typography variant="h4" sx={{fontWeight: "bold", fontSize: "1.8rem", mt: "40px", mb: "20px"}}>
                <LayersOutlinedIcon
                    fontSize="large"
                    sx={{mr: "12px", fontSize: "2.4rem"}}
                    className="icon" />
                {props.area.title}
                <Typography
                    variant="body1"
                    component="span"
                    sx={{fontWeight: "bold", fontSize: "1.4rem", ml: "18px"}}>
                    [Scale: {GoogleMapUtils.getZoomString(props.area.area.zoom)}] [Tangible Key: {props.area.tangibleID}]
                </Typography>
            </Typography>
            {/* <h3 className="detail-sec__heading02">
                <LayersOutlinedIcon className="icon" />{props.area.title}
            </h3> */}
            {props.area.markers.length === 0 ? 
                <Typography
                    variant="h6"
                    sx={{fontWeight: "bold", fontSize: "1.6rem", m: "0px 0px 40px 36px"}}>
                    タンジブル駒がありません。
                </Typography> 
                 :
                <TabElement group="0" label={props.area.title} area={props.area} />}
        </>
    )
}

export default DetailMarkerList
