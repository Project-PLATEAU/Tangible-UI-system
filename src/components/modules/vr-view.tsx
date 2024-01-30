import { useEffect, useState } from "react";

import { useRecoilValue } from "recoil";

// @ts-expect-error: No declaration file for module
import { VRController } from "../../threejs/vr-control";

import { VRAtom } from "../../utils/AppUtils";
import { Area, ThreeArea, AreaUtils} from "../../utils/models/Area";
import { BuildingUtils, Building, ThreeBuilding } from "../../utils/models/Building";
// import { TranUtils, Tran } from "../../utils/models/Tran";
import { Marker, MarkerType, TangibleMarkerUtils } from "../../utils/models/Marker";
import { Workspace, WorkspaceUtils } from "../../utils/models/Workspace";
import { FrnUtils, ThreeFurniture } from "../../utils/models/Furniture";

interface VRProps {
    // bldgSet: [Building[]],
    ws: Workspace,
    upAreas: Area[],
    take: boolean,
    camera: {
        position: { lat: number, lng: number, alt: number},
        target: { lat: number, lng: number, alt: number}
    }
    callback?: (event: VRCallback) => void
}

export interface VRCallback {
    type: string,
    mode: number,
    body?: {
        camera: {
            position: { lat: number, lng: number, alt: number },
            target: { lat: number, lng: number, alt: number },
        },
        blob: Blob,
        base64: string,
    }
}

function VRView(props: VRProps) {
    const [initializer, setInitializer] = useState<boolean>(false);
    const [vrController, setVRController] = useState<VRController | null>(null);
    const [takeSnap, setTakeSnap] = useState<boolean>(false);
    const vrState = useRecoilValue(VRAtom);
    // const [buildings, setBuildings] = useState<Array<Building>>([])
    // const [trans, setTrans] = useState<Array<Tran>>([])

    // 一度だけ初期化してくれる。
    useEffect(() => {
        // console.log('use effect initializer: ' + initializer)
        if (initializer) {
            // console.log('load render')
            if (vrController !== null) {
                // setInitializer(false);
                return;
            }
            console.log('initialize ar')
            if (document.getElementById('vr_view') == null) return;
            // arControllerのuseEffect発火
            setVRController(new VRController('vr_view'));
        } else {
            setInitializer(true);
        }
    }, [initializer]);

    useEffect(() => {
        console.log('use effect arcontroller')
        if (vrController) {
          // console.log('loaded ar')
          setUpController()
        } else {
          console.log('arController is null')
        }
        return function () {
          // Threeのレンダリング停止
          console.log('finish VR2 ' + (vrController ? 'alive' : 'null'))
          if (vrController) {
            vrController.stop()
          }
        }
    }, [vrController])

    useEffect(() => {
        updateMarkers(props.upAreas);
    }, [props.upAreas]);

    useEffect(() => {
        if (props.take) {
            setTakeSnap(true);
        }
    }, [props.take]);

    useEffect(() => {
        if (takeSnap) {
            doTakeSnapShot();
        }
    }, [takeSnap]);

    useEffect(() => {
        updateCameraPosition();
    }, [props.camera])
    
    useEffect(() => {
        if (vrController) {
            vrController.setVrStatus(vrState);
        }
    }, [vrState])

    const setUpController = async () => {
        console.log('setupController')
        // stateにセットし終わった後じゃないと、中のオブジェクトが保持されない。別インスタンスとして扱われるので注意
        if (!vrController) {
            return
        }
        const c = WorkspaceUtils.getCenter(props.ws);
        // console.log(c);
        vrController.setUp(props.ws.areas, c);
        // vrController.initCameraPosition(c, 1.6);
        vrController.start();
        vrController.setVrStatus(vrState);
        // vrController.addQuene('update_dem', DemSample);
        refreshBuildings();
        if (props.callback) {
            props.callback({
                type: "initialized",
                mode: 0,
            });
        }
    };

    const updateCameraPosition = () => {
        if (vrController) {
            vrController.setCameraParameters(props.camera);
        }
    }

    const refreshBuildings = async () => {
        // const result = await getBuildingWithRadius(lat, lng, 100);
        // let newBuildings = []
        // let newTrans = []
        // if (result && result.data) {
        //     const data: any = result.data;
        //     const resBldgs = data.buildings ? data.buildings : [];
        //     // console.log(resBldgs);
        //     newBuildings = resBldgs.map((item: any) => {
        //         return convertCallableApiObj(item);
        //     });

        //     const resTrans = data.trans ? data.trans : [];
        //     newTrans = resTrans.map((item: any) => {
        //         return convertCallableApiObj(item);
        //     });
        // }
        // setBuildings(newBuildings);
        // setTrans(newTrans);
        const allBldgs: Building[] = [];
        const areas = props.ws.areas;
        const allMarkedBldgs: Building[] = [];
        const bldgSet: { areaID: string, n: ThreeBuilding[], m: ThreeBuilding[], a: ThreeArea[] }[] = [];
        for (let i = 0; i < areas.length; i ++) {
            const a = areas[i];
            const bMarkers = a.markers.filter((m: Marker) => m.type === MarkerType.Building);
            const marked: ThreeBuilding[] = [];
            const news: ThreeBuilding[] = [];
            const bldgs = a.bldgs ? a.bldgs : [];
            for (const bldg of bldgs) {
                const f = allBldgs.find((b: Building) => b.gmlID === bldg.gmlID);
                const f2 = allMarkedBldgs.find((b:Building) => b.gmlID === bldg.gmlID);
                const f3 = bMarkers.find((m: Marker) => m.objID === bldg.gmlID);
                if(f) {
                    // 別のエリアで選ばれている
                    if(f2) {
                        // 別のエリアでマーカービルとして選ばれている
                        if(f3) {
                            // 複数エリアで選ばれちゃってるからまずい
                        } else {
                            // 通常ビルだけでマーカービル優先
                        }
                    } else {
                        // 別のエリアで通常ビルとして選ばれている
                        if(f3) {
                            // マーカービルとして追加
                            allMarkedBldgs.push(bldg);
                            marked.push(BuildingUtils.createThreeBuildingFromBuilding(bldg));
                            // 別のエリアで通常建物として選ばれているのでそれを削除
                            for (let j = 0; j < i; j ++) {
                                bldgSet[j].n = bldgSet[j].n.filter((b: ThreeBuilding) => b.gmlID !== bldg.gmlID);
                            }
                        } else {
                            // 別のエリアで通常ビルとして選ばれているので加えない
                        }
                    }
                } else {
                    // 初登場のビル
                    allBldgs.push(bldg);
                    if(f2) {
                        // 無いはず
                        continue;
                    } else {
                        if(f3) {
                            // マーカービルとして追加
                            allMarkedBldgs.push(bldg);
                            marked.push(BuildingUtils.createThreeBuildingFromBuilding(bldg));
                        } else {
                            // 通常ビルとして追加
                            news.push(BuildingUtils.createThreeBuildingFromBuilding(bldg));
                        }
                    }
                }
            }
            const tArea = await AreaUtils.createThreeArea(props.ws.id, a);
            bldgSet.push({ areaID: a.id, n: news, m: marked, a:[tArea] });
            // console.log("set, n:" + news.length + ", m:" + marked.length);
            
        }
        if (vrController) {
            vrController.addQuene('update_building', bldgSet, 0);
        }
        // for (let i = 0; i < bldgSet.length; i ++) {
        //     if (vrController) {
        //         vrController.addQuene('update_building', bldgSet[i], i);
        //     }
        // }
        // if (vrController) {
        //     vrController.addQuene('update_building', newBuildings);
        //     vrController.addQuene('update_tran', newTrans);
        // }
    }; 

    const updateMarkers = (areas: Area[]) => {
        console.log("updatemarkers")
        // console.log(areas);
        // const markerSet: { areaID: string, sm: SnapMarker[], tm: TangibleMarker[] }[] = [];
        const markerSet: { areaID: string, bldgs: ThreeBuilding[], frns: ThreeFurniture[]}[] = [];
        for (const area of areas) {
            if (area.tangible && area.tangible.active) {
                const separates = TangibleMarkerUtils.separateTangibleMarkerWithType(area.tMarkers);
                const b = BuildingUtils.createThreeBuildingsFromTangibleMarkers(separates.bldgs);
                const f = FrnUtils.createThreeFrnsFromTangibleMarkers(separates.frns);
                markerSet.push({
                    areaID: area.id,
                    bldgs: b,
                    frns: f,
                });
            } else {
                markerSet.push({
                    areaID: area.id,
                    bldgs: [],
                    frns: [],
                });
            }
        }
        if (vrController) {
            // console.log(markerSet)
            vrController.addQuene('update_markers', markerSet, 0);
        }
    }

    const doTakeSnapShot = () => {
        if (props.callback) {
            props.callback({
                type: "snapshot",
                mode: 1,
            })
        }
        const canvas: HTMLCanvasElement = vrController.renderer.domElement;
        const camera = vrController.getCameraParameters()
        canvas.toBlob((blob: Blob | null) => {
            if(blob != null) {
                const base64 = canvas.toDataURL("image/png");
                setTakeSnap(false);
                if (props.callback) {
                    props.callback({
                        type: "snapshot",
                        mode: 2,
                        body: {
                            camera: camera,
                            blob: blob,
                            base64: base64,
                        },
                    })
                }
            }
        }, "image/png");
    }

    return (
        <div id="vr_view" style={{height: "100%"}}></div>
    );
}

export default VRView;
