import { useEffect, useRef, useState } from 'react';
import { Group, Rect, Text, Line, Circle } from 'react-konva';
import { STATUSES, type Item, type ItemStatus, type Project } from '../types/items';
import { updateProjectPosition, updateItemPosition, updateItemStatus, updateProjectSize, archiveProject } from '../services/firebase';
import { colors, statusColors } from '../theme';
import { formatRelativeTime } from '../utils/time';
import { getLastActivity } from '../utils/activity';
import { getReadableTextColour } from '../utils/contrast';
import { setStageCursor } from '../utils/cursor';
import { AddItemButton } from './AddItemButton';
import { ArchiveButton } from './ArchiveButton';
import { EditButton } from './EditButton';
import { getDueUrgency } from '../utils/dueDate';

const HEADER_HEIGHT = 34;
const CARD_WIDTH = 100;
const CARD_HEIGHT = 52;
const STRIPE_WIDTH = 8;
const TIMESTAMP_COL_WIDTH = 90;
const HANDLE_WIDTH = 40;
const HANDLE_HEIGHT = 8;
const MIN_HEIGHT_FLOOR = HEADER_HEIGHT + 60;
const MAX_HEIGHT = 1200;
const FOOTER_PADDING = 16;
const HANDLE_INSET = 30; // distance the handle sits above the bottom border, into the body

function statusForLocalX(localX: number, containerWidth: number): ItemStatus {
    const bandWidth = containerWidth / 4;
    const index = Math.min(3, Math.max(0, Math.floor(localX / bandWidth)));
    return STATUSES[index];
}

interface ProjectContainerProps {
    uid: string;
    project: Project;
    items: Item[];
    isHighlighted: boolean;
    onRequestCreate: () => void;
    onRequestEdit: (item: Item) => void;
    onRequestEditProject: (project: Project) => void;
}

export function ProjectContainer({ uid, project, items, onRequestCreate, isHighlighted, onRequestEdit, onRequestEditProject }: ProjectContainerProps) {
    const effectiveColor = project.color || colors.headerBg;
    const headerTextColor = getReadableTextColour(effectiveColor);

    const [liveHeight, setLiveHeight] = useState(project.height);
    const isResizing = useRef(false);
    const [liveX, setLiveX] = useState(project.x);
    const [liveY, setLiveY] = useState(project.y);
    const isDraggingProject = useRef(false);
    const currentPosition = useRef({ x: project.x, y: project.y });
    const headerDragOrigin = useRef<{ x: number; y: number } | null>(null);
    const dragStartLivePos = useRef({ x: project.x, y: project.y });

    useEffect(() => {
        if (!isResizing.current) setLiveHeight(project.height);
    }, [project.height]);

    useEffect(() => {
        if (!isDraggingProject.current) {
            setLiveX(project.x);
            setLiveY(project.y);
            currentPosition.current = { x: project.x, y: project.y };
        }
    }, [project.x, project.y]);

    const bodyHeight = liveHeight - HEADER_HEIGHT;
    const bandWidth = project.width / 4;
    const lastActivity = getLastActivity(items, project.createdAt);

    const contentBottom = items.length ? Math.max(...items.map((i) => i.y + CARD_HEIGHT)) : 0;
    const minHeight = Math.max(MIN_HEIGHT_FLOOR, HEADER_HEIGHT + contentBottom + FOOTER_PADDING);

    const handleArchive = async (e: any) => {
        e.cancelBubble = true;
        const confirmed = window.confirm(`Archive "${project.title}"? It'll be hidden from the board - we don't have a way to view or restore archived projects yet.`);
        if (!confirmed) return;
        await archiveProject(uid, project.id, true);
    };

    const orderedItems = [...items].sort((a, b) => a.createdAt - b.createdAt);

   return (
        <Group x={liveX} y={liveY}>
            <Group
                onMouseEnter={(e) => setStageCursor(e, 'grab')}
                onMouseLeave={(e) => setStageCursor(e, 'grab')}
                draggable
                onDragStart={(e) => {
                    e.cancelBubble = true;
                    isDraggingProject.current = true;
                    setStageCursor(e, 'grabbing');
                    headerDragOrigin.current = e.target.getAbsolutePosition();
                    dragStartLivePos.current = { x: liveX, y: liveY };
                }}
                dragBoundFunc={function (pos) {
                    if (!headerDragOrigin.current) return pos;
                    const stage = this.getStage();
                    const scale = stage ? stage.scaleX() : 1;
                    const deltaX = (pos.x - headerDragOrigin.current.x) / scale;
                    const deltaY = (pos.y - headerDragOrigin.current.y) / scale;
                    const newX = dragStartLivePos.current.x + deltaX;
                    const newY = dragStartLivePos.current.y + deltaY;
                    currentPosition.current = { x: newX, y: newY };
                    setLiveX(newX);
                    setLiveY(newY);
                    return headerDragOrigin.current;
                }}
                onDragEnd={(e) => {
                    e.cancelBubble = true;
                    isDraggingProject.current = false;
                    setStageCursor(e, 'grab');
                    updateProjectPosition(uid, project.id, currentPosition.current.x, currentPosition.current.y);
                }}
            >
                <Rect perfectDrawEnabled={false} width={project.width} height={HEADER_HEIGHT} fill={effectiveColor} cornerRadius={[6, 6, 0, 0]}
                    shadowColor="#000000" shadowBlur={12} shadowOpacity={0.5} shadowOffset={{ x: 0, y: 1 }}/>
                <Text
                    listening={false}
                    text={project.title.toUpperCase()}
                    x={10} y={HEADER_HEIGHT / 2 - 6}
                    fontSize={12} fontStyle="bold" fontFamily="Inter" letterSpacing={0.5}
                    fill={headerTextColor}
                    width={project.width - TIMESTAMP_COL_WIDTH - 90}
                    ellipsis wrap="none"
                />
                <Line listening={false} points={[project.width - TIMESTAMP_COL_WIDTH, 8, project.width - TIMESTAMP_COL_WIDTH, HEADER_HEIGHT - 8]}
                    stroke="#3A4552" strokeWidth={1} />
                <Text
                    listening={false}
                    text={`UPD ${formatRelativeTime(lastActivity)}`}
                    x={project.width - TIMESTAMP_COL_WIDTH + 8} y={HEADER_HEIGHT / 2 - 5}
                    fontSize={9} fontFamily="IBM Plex Mono" fill={headerTextColor} opacity={0.65} letterSpacing={0.3}
                />
            </Group>

            <EditButton x={project.width - TIMESTAMP_COL_WIDTH - 84} y={5} onClick={(e) => { e.cancelBubble = true; onRequestEditProject(project); }} />
            <ArchiveButton x={project.width - TIMESTAMP_COL_WIDTH - 54} y={5} onClick={handleArchive} />
            <AddItemButton x={project.width - TIMESTAMP_COL_WIDTH - 24} y={5} onClick={(e) => { e.cancelBubble = true; onRequestCreate(); }} />

            <Rect y={HEADER_HEIGHT} width={project.width} height={bodyHeight} fill={colors.paper} cornerRadius={[0, 0, 6, 6]}
                shadowColor="#000000" shadowBlur={12} shadowOpacity={0.5} shadowOffset={{ x: 0, y: 1 }}/>

            {STATUSES.map((status, i) => (
                <Group key={status} listening={false}>
                    {i > 0 && <Rect x={i * bandWidth} y={HEADER_HEIGHT} width={1} height={bodyHeight} fill={colors.border} />}
                    <Text text={status.toUpperCase()} x={i * bandWidth + 6} y={HEADER_HEIGHT + 6} fontSize={8} fontFamily="IBM Plex Mono"
                        letterSpacing={0.8} fill={colors.slate} />
                </Group>
            ))}

            <Rect listening={false} width={project.width} height={liveHeight} stroke={effectiveColor} strokeWidth={2} cornerRadius={6}/>
            
            {orderedItems.map((item) => (
                <Group
                    key={item.id}
                    x={item.x} y={item.y}
                    draggable
                    onMouseEnter={(e) => setStageCursor(e, 'grab')}
                    onTap={(e) => { e.cancelBubble = true; onRequestEdit(item); }}
                    onClick={(e) => { e.cancelBubble = true; onRequestEdit(item); }}
                    dragBoundFunc={function (pos) {
                        const stage = this.getStage();
                        const scale = stage ? stage.scaleX() : 1;
                        const parent = this.getParent();
                        const containerAbs = parent ? parent.getAbsolutePosition() : { x: 0, y: 0 };
                        const localX = pos.x - containerAbs.x;
                        const localY = pos.y - containerAbs.y - HEADER_HEIGHT * scale;
                        const maxX = (project.width - CARD_WIDTH) * scale;
                        const maxY = (bodyHeight - CARD_HEIGHT) * scale;
                        const clampedX = Math.max(0, Math.min(maxX, localX));
                        const clampedY = Math.max(0, Math.min(maxY, localY));
                        return { x: containerAbs.x + clampedX, y: containerAbs.y + HEADER_HEIGHT * scale + clampedY };
                    }}
                    onDragStart={(e) => { e.cancelBubble = true; setStageCursor(e, 'grabbing'); }}
                    onDragEnd={(e) => {
                        e.cancelBubble = true;
                        setStageCursor(e, 'grab');
                        const localX = e.target.x();
                        const localY = e.target.y();
                        const newStatus = statusForLocalX(localX, project.width);
                        updateItemPosition(uid, item.id, localX, localY, project.id, project.id);
                        if (newStatus !== item.status) updateItemStatus(uid, item.id, item.status, newStatus);
                    }}
                >
                    <Rect perfectDrawEnabled={false} width={CARD_WIDTH} height={CARD_HEIGHT} fill="#f6f5ff" stroke={colors.border} strokeWidth={1}
                        cornerRadius={4} shadowColor="#000000" shadowBlur={4} shadowOpacity={0.12} shadowOffset={{ x: 0, y: 1 }} />
                    <Rect width={STRIPE_WIDTH} height={CARD_HEIGHT} fill={statusColors[item.status]} cornerRadius={[4, 0, 0, 4]} />
                    <Text text={item.title} x={STRIPE_WIDTH + 8} y={10} fontSize={10} fontFamily="Inter" fill={colors.ink}
                        height={CARD_HEIGHT - 18} width={CARD_WIDTH - STRIPE_WIDTH - 14} wrap="word" ellipsis />
                    {item.status !== 'completed' && getDueUrgency(item.dueDate) && (
                        <Circle
                            x={CARD_WIDTH - 3}
                            y={3}
                            radius={8}
                            fill={getDueUrgency(item.dueDate) === 'overdue' ? colors.dangerIcon : colors.amber}
                        />
                    )}
                </Group>
            ))}

            <Group
                x={(project.width - HANDLE_WIDTH) / 2}
                y={liveHeight - HANDLE_INSET}
                draggable
                onMouseEnter={(e) => setStageCursor(e, 'ns-resize')}
                onMouseLeave={(e) => setStageCursor(e, 'grab')}
                dragBoundFunc={function (pos) {
                    const stage = this.getStage();
                    const scale = stage ? stage.scaleX() : 1;
                    const parent = this.getParent();
                    const containerAbs = parent ? parent.getAbsolutePosition() : { x: 0, y: 0 };
                    const fixedLocalX = (project.width - HANDLE_WIDTH) / 2;
                    const rawLocalY = (pos.y - containerAbs.y) / scale;
                    const clampedLocalY = Math.max(minHeight - HANDLE_INSET, Math.min(MAX_HEIGHT - HANDLE_INSET, rawLocalY));
                    return { x: containerAbs.x + fixedLocalX * scale, y: containerAbs.y + clampedLocalY * scale };
                }}
                onDragStart={(e) => { e.cancelBubble = true; isResizing.current = true; setStageCursor(e, 'ns-resize'); }}
                onDragMove={(e) => { e.cancelBubble = true; setLiveHeight(e.target.y() + HANDLE_INSET); }}
                onDragEnd={(e) => {
                    e.cancelBubble = true;
                    isResizing.current = false;
                    const finalHeight = e.target.y() + HANDLE_INSET;
                    setStageCursor(e, 'grab');
                    updateProjectSize(uid, project.id, finalHeight);
                }}
            >
                <Rect width={HANDLE_WIDTH} height={HANDLE_HEIGHT} fill={colors.neutralIcon} opacity={0.35} cornerRadius={4} />
            </Group>

                {isHighlighted && (
                    <Rect
                        width={project.width}
                        height={liveHeight}
                        stroke={colors.blueprintBlue}
                        strokeWidth={4}
                        cornerRadius={6}
                        shadowColor={colors.blueprintBlue}
                        shadowBlur={16}
                        shadowOpacity={0.6}
                        listening={false}
                    />
                )}
        </Group>
    );
}