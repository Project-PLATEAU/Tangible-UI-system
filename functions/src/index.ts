
import { initializeApp } from "firebase-admin/app";
import * as functions from "firebase-functions";
import { getBuildingApiWithRadius, bldgApp } from "./buildings";
import { frnApp } from "./furnitures";
import { tangibleApp } from "./tangibles";
import { wsApp, refreshMapImage } from "./workspaces";

initializeApp();

const region = "asia-northeast1";


export const tangibles = functions
  .region(region)
  .runWith({ memory: "8GB", timeoutSeconds: 180 })
  .https
  .onRequest(tangibleApp);

export const workspaces = functions
  .region(region)
  .runWith({ memory: "2GB", timeoutSeconds: 180 })
  .https
  .onRequest(wsApp);

export const furnitures = functions
  .region(region)
  .runWith({ memory: "1GB", timeoutSeconds: 180 })
  .https
  .onRequest(frnApp);

export const buildings = functions
  .region(region)
  .runWith({ memory: "1GB", timeoutSeconds: 180 })
  .https
  .onRequest(bldgApp);

export const callRefreshMapImage = functions
  .region(region)
  .runWith({ memory: "2GB", timeoutSeconds: 180 })
  .https
  .onCall(refreshMapImage);

export const getBuildingWithRadius = functions
  .region(region)
  .runWith({ memory: "1GB", timeoutSeconds: 180 })
  .https
  .onCall(getBuildingApiWithRadius);
