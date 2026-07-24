import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useProjects } from '../hooks/useProjects';
import { useItems } from '../hooks/useItems';
import { ProjectContainer } from './ProjectContainer';
import { colors } from '../theme';
import { setStageCursor } from '../utils/cursor';
import { getLastActivity } from '../utils/activity';
import { ItemModal, type ItemFormValues } from './ItemModal';
import { createItem, updateItem, deleteItem } from '../services/firebase';
import { STATUSES, type Item, type Project } from '../types/items';

type ModalState =
  | { mode: 'create'; project: Project }
  | { mode: 'edit'; project: Project; item: Item }
  | null;

export interface Viewport { x: number; y: number; width: number; height: number; scale: number; }

const MIN_SCALE = 0.3;
const MAX_SCALE = 2.5;
const SCALE_BY = 1.05;

export function Board({ onViewportChange }: { onViewportChange: (v: Viewport) => void }) {
    const { projects, loading: projectsLoading } = useProjects();
    const { items, loading: itemsLoading } = useItems();
    const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [stageScale, setStageScale] = useState(1);
    const [dotPattern, setDotPattern] = useState<HTMLImageElement | null>(null);
    const [modalState, setModalState] = useState<ModalState>(null);
    const hasCenteredOnLoad = useRef(false);

    useEffect(() => {
        if (!containerNode) return;
        const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
        });
        observer.observe(containerNode);
        return () => observer.disconnect();
    }, [containerNode]);

    useEffect(() => {
        onViewportChange({ ...stagePos, ...size, scale: stageScale });
    }, [stagePos, size, stageScale, onViewportChange]);

    useEffect(() => {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
        ctx.fillStyle = colors.gridDot;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 1.4, 0, Math.PI * 2);
        ctx.fill();
        }
        const img = new window.Image();
        img.onload = () => setDotPattern(img);
        img.src = canvas.toDataURL();
    }, []);

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        const pointer = stage?.getPointerPosition();
        if (!stage || !pointer) return;

        const oldScale = stageScale;
        const worldPoint = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
        };

        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const rawScale = direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, rawScale));

        setStageScale(newScale);
        setStagePos({
        x: pointer.x - worldPoint.x * newScale,
        y: pointer.y - worldPoint.y * newScale,
        });
    };

    const handleSave = async (values: ItemFormValues) => {
        if (!modalState) return;

        if (modalState.mode === 'create') {
            const { project } = modalState;
            const backlogCount = items.filter(
            (i) => i.containerId === project.id && i.status === 'backlog'
            ).length;
            const offset = (backlogCount % 6) * 14;
            await createItem({
            ...values,
            containerId: project.id,
            x: 8 + offset,
            y: 8 + offset,
            });
        } else {
            const { item, project } = modalState;
            let { x, y } = item;
            if (values.status !== item.status) {
            const bandWidth = project.width / 4;
            x = STATUSES.indexOf(values.status) * bandWidth + 8;
            // y left unchanged — only the status band (x) needs correcting
            }
            await updateItem(item.id, item, { ...values, x, y });
        }
        setModalState(null);
    };

    const handleRemove = async () => {
        if (modalState?.mode !== 'edit') return;
        await deleteItem(modalState.item.id);
        setModalState(null);
    };

    const orderedProjects = useMemo(() => {
        const visible = projects.filter((p) => !p.archived);
        const activityFor = (project: (typeof visible)[number]) =>
        getLastActivity(items.filter((i) => i.containerId === project.id), project.createdAt);
        return [...visible].sort((a, b) => activityFor(a) - activityFor(b));
    }, [projects, items]);

    // Center on the most recently active project, once, after data and canvas size are ready
    useEffect(() => {
        if (hasCenteredOnLoad.current) return;
        if (projectsLoading || itemsLoading) return;
        if (size.width === 0 || size.height === 0) return;
        if (orderedProjects.length === 0) return;

        const mostRecent = orderedProjects[orderedProjects.length - 1]; // ascending sort — last is most recent
        const targetWorldX = mostRecent.x + mostRecent.width / 2;
        const targetWorldY = mostRecent.y + mostRecent.height / 2;

        setStagePos({
        x: size.width / 2 - targetWorldX * stageScale,
        y: size.height / 2 - targetWorldY * stageScale,
        });

        hasCenteredOnLoad.current = true;
    }, [projectsLoading, itemsLoading, size, orderedProjects, stageScale]);

    if (projectsLoading || itemsLoading) {
        return <p>Loading board...</p>;
    }

    return (
        <div ref={setContainerNode} style={{ width: '100%', height: '100%', backgroundColor: colors.canvasBg }}>
            <Stage
                width={size.width}
                height={size.height}
                x={stagePos.x}
                y={stagePos.y}
                scaleX={stageScale}
                scaleY={stageScale}
                draggable
                onMouseEnter={(e) => setStageCursor(e, 'grab')}
                onDragStart={(e) => setStageCursor(e, 'grabbing')}
                onDragEnd={(e) => {
                setStageCursor(e, 'grab');
                setStagePos({ x: e.target.x(), y: e.target.y() });
                }}
                onWheel={handleWheel}
            >
                <Layer>
                {dotPattern && (
                    <Rect
                    x={-10000} y={-10000} width={20000} height={20000}
                    fillPatternImage={dotPattern}
                    fillPatternRepeat="repeat"
                    listening={false}
                    />
                )}
                {orderedProjects.map((project) => (
                    <ProjectContainer
                        key={project.id}
                        project={project}
                        items={items.filter((item) => item.containerId === project.id)}
                        onRequestCreate={() => setModalState({ mode: 'create', project })}
                        onRequestEdit={(item) => setModalState({ mode: 'edit', project, item })}
                    />
                ))}
                </Layer>
            </Stage>
            {modalState && (
                <ItemModal
                    mode={modalState.mode}
                    initialItem={modalState.mode === 'edit' ? modalState.item : undefined}
                    defaultStatus={modalState.mode === 'create' ? 'backlog' : undefined}
                    onCancel={() => setModalState(null)}
                    onSave={handleSave}
                    onRemove={modalState.mode === 'edit' ? handleRemove : undefined}
                />
            )}
        </div>
    );
}