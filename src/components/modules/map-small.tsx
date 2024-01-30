import { GoogleMap, useJsApiLoader, Rectangle } from '@react-google-maps/api';
import { useState, useEffect } from "react";
import { GeoUtils, GoogleMapOptions, GoogleMapUtils } from "../../utils/GeoUtils";
import { Area } from "../../utils/models/Area";

export interface MapProps {
    areas: Area[],
    lat?: number,
    lng?: number,
    selectable : boolean,
    callback?: (event: { type: string, area: Area }) => void 
}

function MapS(props: MapProps) {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_PUBLIC_GOOGLE_MAP_KEY,
    });
    const [centerState, setCenterState] = useState(GeoUtils.defaultCenter);
    const [selAreaIndex, setSelAreaIndex] = useState(0);

    // useEffect(() => {
    //     refreshCenter();
    // }, [props.areas])

    const refreshCenter = async () => {
        if (props.selectable) {
            if (selAreaIndex < props.areas.length) {
                const a = props.areas[selAreaIndex];
                setCenterState({
                    lat: a.area.center.lat,
                    lng: a.area.center.lng,
                });
            }
        } else {
            let lat = 0, lng = 0;
            for (const a of props.areas) {
                lat = lat + a.area.center.lat;
                lng = lng + a.area.center.lng;
            }
            if (props.areas.length > 0) {
                lat = lat / props.areas.length;
                lng = lng / props.areas.length;
                setCenterState({
                    lat: lat,
                    lng: lng,
                });
            }
        }
    }

    useEffect(() => {
        refreshCenter();
    }, [selAreaIndex])

    const clicked = (area: Area, n: number) => {
        setSelAreaIndex(n);
        if (props.callback) {
            props.callback({
                type: "click",
                area: area,
            });
        }
    };

    return isLoaded ? (
        <GoogleMap
            center={centerState}
            zoom={17}
            mapContainerClassName="map"
            id={"map-area-rect"}
            options={GoogleMapOptions.mapOptionsUnZoom}
        >
            { props.selectable ? (
                <>
                { props.areas.map((area: Area, i: number) => {
                const option = i === selAreaIndex ? GoogleMapOptions.rectangleOptionSelected : GoogleMapOptions.rectangleOption;
                return <Rectangle 
                    key={i + 1}
                    bounds={GoogleMapUtils.getRectangleBoundsFromArea(area)}
                    options={option} 
                    onClick={() => clicked(area, i)}
                    />
                })}
                </>
            ) : (
               <>
               { props.areas.map((area: Area, i: number) => {
                return <Rectangle 
                    key={i + 1}
                    bounds={GoogleMapUtils.getRectangleBoundsFromArea(area)}
                    options={GoogleMapOptions.rectangleOption} 
                    />
                })}
               </>
            )
            }
        </GoogleMap>
    ) : null;
}

export default MapS
