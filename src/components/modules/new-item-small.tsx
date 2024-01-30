import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import { useState } from 'react';

import AreaEdgeSelectMenu from './menu-area-edge';
import { Area } from "../../utils/models/Area";

function NewItemSmall(props:{
    area: Area,
    selected: boolean,
    index: number,
    mode: number,
    callback?: (event: {type: string, index: number, edgeIndex: number}) => boolean
}) {
    const cName = props.selected ? "new-meta__item-selected" : "new-meta__item"

    const [edgeAnchor, setEdgeAnchor] = useState<null | HTMLElement>(null);


    const itemClick = (event: React.MouseEvent<HTMLLIElement>) => {
        let flag = false;
        if(props.callback) {
            flag = props.callback({
                type: "area-small",
                index: props.index,
                edgeIndex: -1,
            });
        }
        if (props.mode > 1) {
            if (flag) {
                setEdgeAnchor(event.currentTarget);
            }
        }
        
    };

    const areaEdgeSelectCallback = (e: { type: string, index: number}) => {
        setEdgeAnchor(null);
        if (e.type === "cancel") {
            return;
        }
        if(props.callback) {
            props.callback({
                type: "area-edge-select",
                index: props.index,
                edgeIndex: e.index,
            });
        }
    }

    return (
        <>
            <li className={cName} onClick={itemClick}>
                <LayersOutlinedIcon className="icon" />
                {props.area.title}
            </li>
            <AreaEdgeSelectMenu
                anchor={edgeAnchor}
                callback={areaEdgeSelectCallback} />
        </>
    )
}

export default NewItemSmall
