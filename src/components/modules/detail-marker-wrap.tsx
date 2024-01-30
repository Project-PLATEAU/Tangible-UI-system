import { useRecoilValue } from "recoil";
import DetailMarkerList from "./detail-marker-list";
import { Area } from "../../utils/models/Area";
import { WorkspaceAtom } from "../../utils/models/Workspace";

function DetailMarkerWrap() {
    const wsState = useRecoilValue(WorkspaceAtom);
    return (
        <section className="detail-sec">
            <h2 className="detail-sec__heading">Tangible KOMA</h2>
            { wsState.areas.map((area: Area, i: number) => {
                return <DetailMarkerList area={area} key={area.id + i}/>
            })}
        </section>
    )
}

export default DetailMarkerWrap
