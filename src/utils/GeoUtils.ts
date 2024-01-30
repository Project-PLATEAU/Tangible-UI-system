import * as geofire from "geofire-common";
import { MarkerPosition } from "./models/Marker";
import { Area } from "./models/Area";

const EARTH = 40075016.68;
const HALF_EARTH = EARTH / 2;
// "epsg:3857";

const lngToSphMerc = (lng: number) => {
  return (lng / 180) * HALF_EARTH;
};

const latToSphMerc = (lat: number) => {
  const y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  return (y * HALF_EARTH) / 180.0;
};

const sphMercToLng = (x: number) => {
  return (x / HALF_EARTH) * 180.0;
};

const sphMercToLat = (y: number) => {
  let lat = (y / HALF_EARTH) * 180.0;
  lat =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
  return lat;
};

export const WorldProjection = {
  latToSphMerc,
  lngToSphMerc,
  sphMercToLat,
  sphMercToLng,
};

const getRadius = (p1: {lat: number, lng: number}, p2: {lat:number, lng: number}) => {
  const pp1 = [p1.lat, p1.lng] as geofire.Geopoint;
  const pp2 = [p2.lat, p2.lng] as geofire.Geopoint;
  const radius = geofire.distanceBetween(pp1, pp2) / 2 * 1000; // km to m
  return radius;
};

const getDistance = (p1: {lat: number, lng: number}, p2: {lat:number, lng: number}) => {
  const pp1 = [p1.lat, p1.lng] as geofire.Geopoint;
  const pp2 = [p1.lat, p2.lng] as geofire.Geopoint;
  const d = geofire.distanceBetween(pp1, pp2) * 1000; // km to m
  return d;
}

const getGeoBounds = (lat: number, lng: number, radius: number) => {
  return geofire.geohashQueryBounds([lat, lng], radius)
};

const defaultCenter = {
  lat: 35.4558697,
  lng: 139.6325174
};

const transferFootPrintsWithMarkerPosition = (
  center: {lat: number, lng: number},
  footprint: {latitude: number, longitude: number, altitude?: number}[],
  mPos: MarkerPosition
) => {
  const bldgWC = {
    y: WorldProjection.latToSphMerc(center.lat),
    x: WorldProjection.lngToSphMerc(center.lng),
  };
  const mWC = {
    y: WorldProjection.latToSphMerc(mPos.center.lat),
    x: WorldProjection.lngToSphMerc(mPos.center.lng),
  };
  const r = mPos.rotation;
  const newFoots = footprint.map((pos: {
    latitude: number, longitude: number, altitude?: number
  }) => {
    const divWP = {
      y: WorldProjection.latToSphMerc(pos.latitude),
      x: WorldProjection.lngToSphMerc(pos.longitude),
    };
    const divMeter = {
      x: divWP.x - bldgWC.x,
      y: divWP.y - bldgWC.y,
    };
    const rotatedDivMeter = {
      x: divMeter.x * Math.cos(r) - divMeter.y * Math.sin(r),
      y: divMeter.x * Math.sin(r) + divMeter.y * Math.cos(r),
    };
    const fixWP = {
      x: mWC.x + rotatedDivMeter.x,
      y: mWC.y + rotatedDivMeter.y,
    };
    const fixLonLat = {
      latitude: WorldProjection.sphMercToLat(fixWP.y),
      longitude: WorldProjection.sphMercToLng(fixWP.x),
      altitude: pos.altitude,
    };
    return fixLonLat;
  });
  return newFoots;
};

export const GeoUtils = {
  transferFootPrintsWithMarkerPosition,
  getGeoBounds,
  getRadius,
  defaultCenter,
  getDistance,
};

const mapOptions = {
  fullscreenControl: false,
  mapTypeControl: false,
  mapType: 'terrain',
  streetViewControl: false,
  zoomControl: true,
  scaleControl: true,
  gestureHandling: 'greedy',
};

const mapOptionsUnZoom = {
  fullscreenControl: false,
  mapTypeControl: false,
  mapType: 'terrain',
  streetViewControl: false,
  zoomControl: false,
  gestureHandling: 'greedy',
};

const rectangleOptionUnClickable = {
  fillOpacity: 0.1,
  strokeOpacity: 1,
  strokeWeight: 2,
  draggable: false,
  geodesic: false,
  editable: false,
  clickable: false,
  zIndex: 1,
  fillColor: "#ffffff",
  strokeColor: "#66cc00",
};

const rectangleOption = {
  fillOpacity: 0.1,
  strokeOpacity: 1,
  strokeWeight: 2,
  draggable: false,
  geodesic: false,
  editable: false,
  zIndex: 1,
  fillColor: "#66cc00",
  strokeColor: "#66cc00",
};

const rectangleOptionSelected = {
  fillOpacity: 0.3,
  strokeOpacity: 1,
  strokeWeight: 6,
  draggable: false,
  geodesic: false,
  editable: false,
  zIndex: 1,
  fillColor: "#ffebcd",
  strokeColor: "#ff6600",
};

const rectangleOptionEdit = {
  fillOpacity: 0.3,
  strokeOpacity: 1,
  strokeWeight: 4,
  draggable: true,
  geodesic: false,
  editable: false,
  zIndex: 1,
  fillColor: "#cdebff",
  strokeColor: "#0066ff",
};

const getRectangleBoundsFromArea = (area: Area | null) => {
  if (area !== null) {
    const position = area.area;
    return {
        north: position.NE.lat,
        south: position.SW.lat,
        east: position.NE.lng,
        west: position.SW.lng,
    };
  }
  return { north: 0, south: 0, east: 0, west: 0, };
};

const getPolyFillColor = (type: string) => {
  if (type === "building") {
    return "#ccaa33";
  } else if (type === "frn") {
    return "#33aacc";
  } else if (type === "veg") {
    return "#339933";
  } else if (type === "selected") {
    return "#aa3366";
  } else {
    return "#666666";
  }
};

const getPolyStrokeColor = (type: string) => {
  if (type === "building") {
    return "#ffcc00";
  } else if (type === "frn") {
    return "#00ccff";
  } else if (type === "veg") {
    return "#00ffcc";
  } else if (type === "selected") {
    return "#dd0033";
  } else {
    return "#333333";
  }
};

const getZoomString = (scale: number) => {
  if (scale >=17.82 && scale < 17.83) {
    return "1/2000";
  } else if (scale >= 18.82 && scale < 18.83) {
    return "1/1000";
  } else if (scale >= 20.14 && scale < 20.15) {
    return "1/400";
  } else if (scale >= 21.14 && scale < 21.15) {
    return "1/200";
  } else if (scale >= 22.14 && scale < 22.15) {
    return "1/100";
  } else if (scale >= 23.14 && scale < 23.15) {
    return "1/50";
  } else {
    return "unknown";
  }
};


export const GoogleMapOptions = {
  mapOptions,
  mapOptionsUnZoom,
  rectangleOption,
  rectangleOptionSelected,
  rectangleOptionEdit,
  rectangleOptionUnClickable,
};

export const GoogleMapUtils = {
  getRectangleBoundsFromArea,
  getPolyFillColor,
  getPolyStrokeColor,
  getZoomString,
};
