import { Box } from '@mui/material';
import { GoogleMap, useJsApiLoader, Polygon } from '@react-google-maps/api';

import { useEffect, useState } from "react";

import snapshotImage from "../../images/dummy/dummy_snapshot_small.png";
import { GoogleMapOptions, GoogleMapUtils } from "../../utils/GeoUtils";
import { Building } from "../../utils/models/Building";
import { FrnUtils, Furniture } from "../../utils/models/Furniture";
import { Marker, MarkerType } from "../../utils/models/Marker";

const polyOpt = {
    fillOpacity: 0.3,
    strokeOpacity: 1,
    strokeWeight: 2,
    draggable: false,
    geodesic: false,
    editable: false,
    zIndex: 1,
    fillColor: GoogleMapUtils.getPolyFillColor("building"),
    strokeColor: GoogleMapUtils.getPolyStrokeColor("building"),
};

function DetailBldgMarker(props: {bldg: Building}) {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_PUBLIC_GOOGLE_MAP_KEY,
    });

    const convertBldgCenterToGMap = (c: { latitude: number, longitude: number, altitude: number }) => {
        return {
            lat: c.latitude,
            lng: c.longitude,
        };
    };

    const getPath = (obj: Building) => {
        const paths = obj.footprint.map((foot: { latitude: number, longitude: number, altitude?: number }) => {
            return { lat: foot.latitude, lng: foot.longitude };
          })
        return paths;
    }

    return (
        <Box className="detail-street__box">
            { isLoaded && (
            <GoogleMap
                center={convertBldgCenterToGMap(props.bldg.center)}
                zoom={18}
                id={props.bldg.gmlID}
                mapContainerClassName="detail-street__map"
                options={GoogleMapOptions.mapOptionsUnZoom}
            >
                <Polygon
                paths={getPath(props.bldg)}
                options={polyOpt}
                key={props.bldg.gmlID}
                />
            </GoogleMap>
            )}
        </Box>
    );
}

function DetailFrnMarker(props: {frn?: Furniture}) {
    const [thumb, setThumb] = useState(snapshotImage);
    useEffect(() => {
        loadThumbnail();
    }, []);

    const loadThumbnail = async () => {
        if (props.frn) {
            const url = await FrnUtils.loadThumbUrl(props.frn);
            if (url) {
                setThumb(url);
            }
        }
    };

    return (
        <figure className="detail-street__image">
            <img src={thumb} alt="" decoding="async" />
        </figure>
    );
}

function DetailSpecialFrnMarker() {
    const thumb = snapshotImage;
    return (
        <figure className="detail-street__image">
            <img src={thumb} alt="" decoding="async" />
        </figure>
    );
}

function DetailMarkerItem(props: {marker: Marker}) {
    const [name, setName] = useState("");
    const [subId, setSubId] = useState("");
    const [aruco, setAruco] = useState("");
    
    useEffect(() => {
        if (props.marker.type === MarkerType.Furniture) {
            if (props.marker.frn && props.marker.frn.name) {
                setName(props.marker.frn.name);
                setSubId(props.marker.objID);
            }
        } else if (props.marker.type === MarkerType.Building) {
            if (props.marker.bldg) {
                setName(props.marker.bldg.bldgID);
                setSubId(props.marker.objID);
            }
        } else if (props.marker.type === MarkerType.Special) {
            if (props.marker.special) {
                setName(props.marker.special.name);
                setSubId(props.marker.objID);
            }
        }
        setArucoSrc();
    }, []);

    const setArucoSrc = () => {
        const n = Number(props.marker.markerID) as number;
        setAruco("/aruco/4x4_1000-" + n + ".svg");
    };

    return (
        <>
            {props.marker.type === MarkerType.Furniture && <DetailFrnMarker frn={props.marker.frn} />}
            {props.marker.type === MarkerType.Building && <DetailBldgMarker bldg={props.marker.bldg as Building} />}
            {props.marker.type === MarkerType.Special && <DetailSpecialFrnMarker />}
            <dl className="detail-street__content">
                <dt className="detail-street__heading">{name}</dt>
                <dd>
                    <p className="detail-street__id">{subId}</p>
                    <figure className="detail-street__qr">
                        <img src={aruco} alt="" width={120} height={120} style={{padding: "16px"}} decoding="async"/>
                        <figcaption className="detail-street__markerId">{props.marker.markerID}</figcaption>
                    </figure>
                </dd>
            </dl>
        </>
    );
}

export default DetailMarkerItem
