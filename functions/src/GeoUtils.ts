import * as geofire from "geofire-common";

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

export const getRadius = (p1: { lat: number, lng: number }, p2: { lat: number, lng: number }) => {
  const pp1 = [p1.lat, p1.lng] as geofire.Geopoint;
  const pp2 = [p2.lat, p2.lng] as geofire.Geopoint;
  const radius = geofire.distanceBetween(pp1, pp2) / 2 * 1000; // km to m
  return radius;
};

export const getGeoBounds = (lat: number, lng: number, radius: number) => {
  return geofire.geohashQueryBounds([lat, lng], radius);
};

