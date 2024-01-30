import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    TouchSensor,
    closestCenter
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
    useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import QrCode from "@mui/icons-material/QrCode";
import RemoveCircleOutlined from "@mui/icons-material/RemoveCircleOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";

import { useState, useEffect, HTMLAttributes, CSSProperties } from "react";

import DetailMarkerItem from './detail-marker-item';
import { loadMarkerObjectFromArea } from '../../utils/firebase/firebase';
import { Area } from '../../utils/models/Area';
import { Marker } from '../../utils/models/Marker';

type DndMarker = {
    id: string,
    marker: Marker,
}

type Props = {
    item: DndMarker
    callback?: (event: { id: string }) => void
} & HTMLAttributes<HTMLDivElement>

const SortableItem =({ item, callback, ...props }: Props) => {
    const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({id: item.id,});
    const styles: CSSProperties = {
        transition: transition || undefined,
        cursor: isDragging ? "grabbing" : "grab",
        transform: CSS.Transform.toString(transform),
    }

    const deleteBtnPressed = () => {
        console.log('delete')
        console.log(callback)
        if(callback) {
            callback({id: item.id});
        }
    }

    const insideBox = () => {
        return (
            <Box style={{position: "relative"}}>
                <DetailMarkerItem marker={item.marker}/>
                <IconButton 
                    className="modal-sort-delete"
                    sx={{position: "absolute", background: "#fff", borderRadius: "18px", p: "6px", right: "-6px"}}
                    onClick={() => deleteBtnPressed()}>
                    <RemoveCircleOutlined fontSize='large' color="error"/>
                </IconButton>
            </Box>
        )
    }

    return (
        Number(item.marker.markerID) < 90 ?
        <Box
            ref={setNodeRef}
            style={styles}
            {...props}
            {...attributes}
            {...listeners}
        >
            {insideBox()}
        </Box>
        :
        <Box
            ref={setNodeRef}
            style={styles}
            {...props}
            {...attributes}
        >
            {insideBox()}
        </Box>
    )
}



function ModalPeaceSort(props:{
    open: boolean,
    area: Area,
    callback?: (event: { type: string, area?: Area }) => void
}) {
    const [openState, setOpenState] = useState(props.open);
    const [dndMarkers, setDndMarkers] = useState<DndMarker[]>([]);

    useEffect(() => {
        setOpenState(props.open);
        if (props.open) {
            loadUnits(props.area);
        }
    }, [props.open])


    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 }}),
        useSensor(TouchSensor, { activationConstraint: { distance: 5 }})
    );

    const cancelHandler = () => {
        if(props.callback) {
            props.callback({
                type: "cancel"
            });
        }
        setDndMarkers([]);
        setOpenState(false);
    };
    const doneHandler = () => {
        const markers = dndMarkers.map((dM: DndMarker) => {
            return dM.marker;
        })
        const nA = { ...props.area }
        nA.markers = markers;
        if(props.callback) {
            props.callback({
                type: "done",
                area: nA,
            });
        }
        setDndMarkers([]);
        setOpenState(false);
    };

    const loadUnits = async (tArea: Area) => {
        const a = await loadMarkerObjectFromArea(tArea);
        const dm = a.markers.map((m: Marker) => {
            return {
                marker: m,
                id: m.markerID,
            } as DndMarker;
        });
        setDndMarkers(dm);
    };

    const mDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) {
            return;
        }
        const activeIndex = dndMarkers.findIndex(m => m.id === active.id);
        const overIndex = dndMarkers.findIndex(m => m.id === over.id);
        const overItem = dndMarkers.find(m => m.id === over.id);
        if (overItem && Number(overItem.marker.markerID) > 90) {
            return;
        } 
        if (overIndex < 90) {
            const nI = arrayMove(dndMarkers, activeIndex, overIndex);
            const nI2 = sortMarkerID(nI);
            setDndMarkers(nI2);
        }
    };

    // idの順番はDndContext辺りで保管してるらしい。なので、markerIDだけリフレッシュしておく
    const sortMarkerID = (ms: DndMarker[]) => {
        const ms2 = ms.map((m: DndMarker, index: number) => {
            const newId = index < 10 ? "0" + index : "" + index;
            const nM = {...m.marker}
            if (Number(nM.markerID) < 90) {
                nM.markerID = newId;
            }
            return {
                marker: nM,
                id: m.id,
            };
        });
        return ms2;
    };

    const deleteCallback = (e: {id: string}) => {
        const nI = dndMarkers.filter(m => m.id !== e.id);
        const nI2 = sortMarkerID(nI);
        setDndMarkers(nI2);
    };

    return (
        <Modal open={openState} onClose={cancelHandler} >
            <Box className="modal modal-peace">
                <h2 className="modal__heading">
                    <QrCode className="icon" />
                    並び替え
                </h2>
                <p className="modal__counter">{ dndMarkers.length } / 99</p>
                <Box sx={{mt: "20px"}}>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={mDragEnd}
                    >
                        <SortableContext items={dndMarkers} strategy={rectSortingStrategy}>
                            <Box className="detail-street">
                                {dndMarkers.map((m: DndMarker) => {
                                    return (
                                        <SortableItem 
                                            item={m}
                                            key={m.id}
                                            className="detail-street__item"
                                            callback={deleteCallback}
                                            />
                                    );
                                })}
                            </Box>
                        </SortableContext>
                    </DndContext>
                </Box>
                <Stack direction="row" spacing={"15px"} className="modal__button">
                    <Button variant="contained" color="secondary" onClick={doneHandler}>保存</Button>
                    <Button variant="outlined" type="reset" onClick={cancelHandler}>キャンセル</Button>
                </Stack>
            </Box>
        </Modal>
    )
}

export default ModalPeaceSort
