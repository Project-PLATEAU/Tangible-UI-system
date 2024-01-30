import express from "express";
import { getFirestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { authorizeWithApiKey } from "./users";
import {
  COLLECTIONS,
  createStoragePublicUrl,
  catchEResponse,
} from "./utils";

/*
 * Express API
 */


export const frnApp = express();

frnApp.use(express.json());

frnApp.route("/")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: authCheck.message });
    }
    const db = getFirestore();
    try {
      const col = db.collection(COLLECTIONS.FURNITURES);
      const query = col.orderBy("created", "desc");
      const snaps = await query.get();
      const docs: any[] = [];
      snaps.docs.forEach((doc: QueryDocumentSnapshot) => {
        const data = {
          ...doc.data(),
          frnId: doc.id,
        };
        docs.push(data);
      });
      return res
        .status(200)
        .json(docs);
    } catch (e) {
      return catchEResponse(e, res);
    }
  });

// ファニチャーデータ取得
frnApp.route("/:id")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: authCheck.message });
    }
    const db = getFirestore();
    if (req.params.id !== null) {
      console.log(req.params.id);
      try {
        const col = db.collection(COLLECTIONS.FURNITURES);
        const doc = await col.doc(req.params.id).get();
        const data = doc.data();
        if (doc.exists && data) {
          const thumbPath = "frn/" + data.type + "/" + data.thumbnail;
          const thumbUrl = await createStoragePublicUrl(thumbPath);
          const objPath = "frn/" + data.type + "/" + data.objName;
          const objUrl = await createStoragePublicUrl(objPath);
          const obj = {
            ...data,
            thumbUrl: thumbUrl ? thumbUrl : "",
            objUrl: objUrl ? objUrl : "",
          };
          res
            .status(200)
            .json(obj);
        } else {
          res
            .status(402)
            .json({ error: "error", message: "Furniture is not found with ID:" + req.params.id });
        }
      } catch (e) {
        return catchEResponse(e, res);
      }
      return;
    }
    return res
      .status(404)
      .json({ error: "error", message: "Require gmlID" });
  });
