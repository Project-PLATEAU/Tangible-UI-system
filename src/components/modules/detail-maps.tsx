import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { GoogleMap, useJsApiLoader, Rectangle } from '@react-google-maps/api';

import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from "recoil";

import SnapshotNav from "./spnapshot-nav";
import BgAr from '../../images/dummy/dummy_ar_large.png';
import { GoogleMapOptions, GoogleMapUtils } from "../../utils/GeoUtils";
import { Area } from "../../utils/models/Area";
import { WorkspaceAtom, WorkspaceUtils } from "../../utils/models/Workspace";
import { Snapshot, SnapshotUtils } from "../../utils/models/Snapshot";

function DetailMaps() {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_PUBLIC_GOOGLE_MAP_KEY,
    });

    const router = useNavigate();

    const wsState = useRecoilValue(WorkspaceAtom);
    const [snapshot, setSnapShot] = useState<Snapshot>(SnapshotUtils.createBlank());
    const [selIndex, setSelIndex] = useState(0);
    const [aTitle, setATitle] = useState("")

    useEffect(() => {
        if (snapshot.id === "blank") {
            setUpSnapShot();
        }
    }, [snapshot])

    const onClickRect = (i: number, area: Area) => {
        setSelIndex(i);
        setATitle(area.title);
    }

    const setUpSnapShot = async () => {
        if (wsState.areas.length > 0) {
            const area = wsState.areas[0];
            setATitle(area.title);
        }
        if (wsState.snapshots.length > 0) {
            const snap = wsState.snapshots[0];
            const url = await SnapshotUtils.loadThumbUrl(wsState.id, snap);
            const snap2 = { ...snap };
            snap2.screenUrl = url;
            setSnapShot(snap2);
        }
    }

    const snapNavCallback = (e: { type: string, value: boolean }) => {
        if (e.type === "fullscreen" && e.value) {
            router("/full/" + wsState.id);
        }
    };
    // <img src={snapshot.screenUrl} alt="" />

    return (
        <>
            <SnapshotNav enable={false} full={true} callback={snapNavCallback}/>
            <Box className="detail-area">
                <Box className="detail-area__ar">
                    {snapshot.screenUrl ?
                        <img src={snapshot.screenUrl} alt={snapshot.screenshot} /> :
                        <img src={BgAr} alt="" />
                    }
                </Box>
                <Box className="detail-area__map">
                    { isLoaded && (
                    <GoogleMap
                        center={WorkspaceUtils.getCenter(wsState)}
                        zoom={17}
                        mapContainerClassName="map"
                        id={"map-detail"}
                        options={GoogleMapOptions.mapOptions}
                    >
                        { wsState.areas.map((area: Area, i: number) => {
                            let option = GoogleMapOptions.rectangleOption;
                            if (i === selIndex) {
                                option = GoogleMapOptions.rectangleOptionSelected;
                            }
                            return <Rectangle 
                                key={i + 1}
                                bounds={GoogleMapUtils.getRectangleBoundsFromArea(area)}
                                options={option}
                                onClick={() => onClickRect(i, area)}
                                />
                        })}
                    </GoogleMap>
                )}
                    <Typography
                        variant="h5"
                        component="span"
                        sx={{
                            position: "relative",
                            top: "-488px",
                            m: "6px",
                            p: "6px",
                            color: "#333333",
                            backgroundColor: "#ffebcd",
                            borderRadius: "6px"
                        }}>
                        { aTitle }
                    </Typography>
                </Box>
            </Box>
        </>
    )
}

export default DetailMaps
