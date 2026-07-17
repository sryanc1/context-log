import { useEffect, useMemo, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useProjects } from '../hooks/useProjects';
import { useItems } from '../hooks/useItems';
import { ProjectContainer } from './ProjectContainer';
import { colors } from '../theme';


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

    const [dotPattern, setDotPattern] = useState<HTMLImageElement | null>(null);

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

    const orderedProjects = useMemo(() => {
        const visible = projects.filter((p) => !p.archived);
        const lastActivity = (projectId: string, projectUpdatedAt: number) => {
        const itemTimestamps = items
            .filter((i) => i.containerId === projectId)
            .map((i) => i.updatedAt);
        return Math.max(projectUpdatedAt, ...itemTimestamps, 0);
        };
        return [...visible].sort(
        (a, b) => lastActivity(a.id, a.updatedAt) - lastActivity(b.id, b.updatedAt)
        );
    }, [projects, items]);

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
                onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
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
                    <ProjectContainer key={project.id} project={project} items={items.filter((i) => i.containerId === project.id)} />
                ))}
                </Layer>
            </Stage>
        </div>
    );
}