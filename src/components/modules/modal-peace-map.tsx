// import React from "react";
import Box from "@mui/material/Box";
import { GoogleMap, useJsApiLoader, Polygon, Rectangle, InfoWindow } from '@react-google-maps/api';
import { useState, useEffect } from "react";
import { GeoUtils, GoogleMapOptions, GoogleMapUtils } from "../../utils/GeoUtils";
import { Area } from "../../utils/models/Area";
import { Building } from "../../utils/models/Building";
import { Marker, MarkerUtils, MarkerType } from "../../utils/models/Marker";

export interface MapProps {
    bldgs: Building[],
    area: Area,
    callback?: (event: { type: string, markers: Marker[] }) => void 
}

function ModalPeaceMap(props: MapProps) {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_PUBLIC_GOOGLE_MAP_KEY,
    });
    const [centerState, setCenterState] = useState(GeoUtils.defaultCenter);

    const [markerState, setMarkerState] = useState<Marker[]>(props.area.markers);
    // const [markerBldgs, setMarkerBldgs] = useState<Marker[]>([]);
    const [infoBldg, setInfoBldg] = useState<Building | null>(null);

    useEffect(() => {
        // updateMarkerBldgs();
        setCenterState(props.area.area.center);
    }, [])

    // const updateMarkerBldgs = () => {
    //     const mb = markerState.filter((marker: Marker) => {
    //         return marker.type === MarkerType.Building && !marker.delete;
    //     });
    //     setMarkerBldgs(mb);
    // }

    const makePolyParams = (obj: Building) => {
        const paths = obj.footprint.map((foot: { latitude: number, longitude: number, altitude?: number }) => {
          return { lat: foot.latitude, lng: foot.longitude }
        })
        let fColor = GoogleMapUtils.getPolyFillColor("building");
        let sColor = GoogleMapUtils.getPolyStrokeColor("building");
        if (MarkerUtils.findMarkerFromUniqueID(obj.gmlID, MarkerType.Building, markerState)) {
            fColor = GoogleMapUtils.getPolyFillColor("selected");
            sColor = GoogleMapUtils.getPolyStrokeColor("selected");
        }
        const opt = {
          fillOpacity: 0.3,
          strokeOpacity: 1,
          strokeWeight: 2,
          draggable: false,
          geodesic: false,
          editable: false,
          zIndex: 1,
          fillColor: fColor,
          strokeColor: sColor
        }
        return { paths, opt }
    }

    const onClickBldg = (bldg: Building) => {
        // event: google.maps.MapMouseEvent,
        const mObj = MarkerUtils.findMarkerFromUniqueID(bldg.gmlID, MarkerType.Building, markerState);
        let nM: Marker[];
        if (mObj) {
            nM = MarkerUtils.removeMarkerFromUniqueID(bldg.gmlID, MarkerType.Building, markerState);
            setMarkerState(nM);
            setInfoBldg(null);
        } else {
            const newMarker = MarkerUtils.createMarkerFromBuilding(bldg, markerState);
            nM = MarkerUtils.addMarker(newMarker, markerState);
            // nM = [...markerState];
            // nM.push(newMarker);
            setMarkerState(nM);
            setInfoBldg(bldg);
        }
        if(props.callback) {
            props.callback({
                type: "marker",
                markers: nM,
            })
        }
    }

    return (
            isLoaded ? (
            <GoogleMap
                center={centerState}
                zoom={17}
                mapContainerClassName="map"
                id={"map-piece"}
                options={GoogleMapOptions.mapOptions}
            >
                {props.bldgs.map((bldg: Building) => {
                    const { paths, opt} = makePolyParams(bldg)
                    return (
                      <Polygon
                        paths={paths}
                        options={opt}
                        key={bldg.gmlID}
                        onClick={() => {
                            onClickBldg(bldg);
                        }}
                      />
                    )
                })}
                {infoBldg && 
                    <InfoWindow
                        position={{
                            lat: infoBldg.center.latitude,
                            lng: infoBldg.center.longitude
                        }}
                        options={{ maxWidth: 300 }} >
                        <Box sx={{ width: "100%", m: 0 }}>{infoBldg.bldgID}</Box>
                    </InfoWindow>}
                {/* {markerBldgs.map((marker: Marker) => {
                    return (
                        <InfoWindow
                            position={{
                                lat: marker.bldg!.center.latitude,
                                lng: marker.bldg!.center.longitude
                            }}
                            options={{ maxWidth: 300 }}
                            >
                            <Box sx={{ width: '100%', m: 0 }}>{marker.bldgID!}</Box>
                        </InfoWindow>
                    )
                })} */}
                <Rectangle
                    bounds= {GoogleMapUtils.getRectangleBoundsFromArea(props.area)}
                    options={GoogleMapOptions.rectangleOptionUnClickable}
                    />
            </GoogleMap>
            ) : null
    ) 
}

export default ModalPeaceMap
