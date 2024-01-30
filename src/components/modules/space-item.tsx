import IconButton from '@mui/material/IconButton';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapS from './map-small'
import snapshotImage from '../../images/dummy/dummy_snapshot_small.png'
import { Workspace, WorkspaceUtils } from '../../utils/models/Workspace';
import { SnapshotUtils, Snapshot } from '../../utils/models/Snapshot';
import { getDateString } from "../../utils/UserUtils";

function SpaceItem(props:{ 
    isStatus: boolean,
    workspace: Workspace
}) {
    const router = useNavigate();
    const [snap, setSnap] = useState<Snapshot>(SnapshotUtils.createBlank());

    useEffect(() => {
        setUpSnapshot();
    }, [])

    const getAreaTitle = () => {
        if (props.workspace.areas.length > 0) {
            const a = props.workspace.areas[0];
            return a.title;
        } else {
            return "エリアが設定されていません";
        }
    };

    const setUpSnapshot = async () => {
        if (props.workspace.snapshots.length > 0) {
            const latestSnap = { ...props.workspace.snapshots[0] };
            const url = await SnapshotUtils.loadThumbUrl(props.workspace.id, latestSnap);
            latestSnap.screenUrl = url;
            setSnap(latestSnap);
        }
    }

    const buttonPressed = async () => {
        router("/detail/" + props.workspace.id);
    };

    const vrButtonPressed = async () => {
        router("/full/" + props.workspace.id);
    };


    return (
        <div className="space-list__item">
            <h2 className="space-list__heading" onClick={buttonPressed}>{props.workspace.title}</h2>
            <figure className="space-list__image" onClick={buttonPressed}>
                { snap.screenUrl ?
                <img src={snap.screenUrl} alt="" width={300} height={160} decoding="async" /> :
                <img src={snapshotImage} alt="" width={300} height={160} decoding="async" /> 
                }
            </figure>
            <div className="space-list__meta">
                {WorkspaceUtils.hasActiveArea(props.workspace) ? <p className="space-list__status -active">稼働中</p> : <p className="space-list__status -nonactive">停止中</p>}
                <IconButton onClick={vrButtonPressed} className="space-list__button">
                    <ViewInArIcon />
                </IconButton>
            </div>
            <p className="space-list__text">{props.workspace.description}</p>
            <table className="space-list__table" aria-label="ワークスペースの情報">
                <tbody>
                    <tr>
                        <th>作成日</th>
                        <td>
                            <time dateTime="2023-04-17">{getDateString(props.workspace.created)}</time>
                        </td>
                    </tr>
                    <tr>
                        <th>更新日</th>
                        <td>
                            <time dateTime="2023-04-17">{getDateString(props.workspace.modified)}</time>
                        </td>
                    </tr>
                    <tr>
                        <th>エリア</th>
                        <td>{getAreaTitle()}</td>
                    </tr>
                </tbody>
            </table>
            <div className="space-list__map">
                <MapS areas={props.workspace.areas} selectable={false} />
            </div>
        </div>
    )
}

export default SpaceItem
