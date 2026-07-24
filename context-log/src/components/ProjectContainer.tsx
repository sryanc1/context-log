import { Group, Rect, Text, Line } from 'react-konva';
import type { Item, ItemStatus, Project } from '../types/items';
import { updateProjectPosition, updateItemPosition, updateItemStatus, archiveProject } from '../services/firebase';
import { colors, statusColors } from '../theme';
import { formatRelativeTime } from '../utils/time';
import { AddItemButton } from './AddItemButton';
import { ArchiveButton } from './ArchiveButton';
import { setStageCursor } from '../utils/cursor';
import { getLastActivity } from '../utils/activity';
import { EditButton } from './EditButton';
import { getReadableTextColour } from '../utils/contrast';

const HEADER_HEIGHT = 34;
const STATUSES: ItemStatus[] = ['backlog', 'active', 'waiting', 'completed'];
const CARD_WIDTH = 100;
const CARD_HEIGHT = 36;
const STRIPE_WIDTH = 4;
const TIMESTAMP_COL_WIDTH = 90;

interface ProjectContainerProps {
    project: Project;
    items: Item[];
    onRequestCreate: () => void;
    onRequestEdit: (item: Item) => void;
    onRequestEditProject: (project: Project) => void;
}

function statusForLocalX(localX: number, containerWidth: number): ItemStatus {
    const bandWidth = containerWidth / 4;
    const index = Math.min(3, Math.max(0, Math.floor(localX / bandWidth)));
    return STATUSES[index];
}

export function ProjectContainer({ project, items, onRequestCreate, onRequestEdit, onRequestEditProject }: ProjectContainerProps) {
    const bodyHeight = project.height - HEADER_HEIGHT;
    const bandWidth = project.width / 4;
    const lastActivity = getLastActivity(items, project.createdAt);
    const effectiveColor = project.color || colors.headerBg;
    const headerTextColor = getReadableTextColour(effectiveColor)

    const handleArchive = async (e: any) => {
        e.cancelBubble = true;
        const confirmed = window.confirm(
            `Archive "${project.title}"? It'll be hidden from the board — we don't have a way to view or restore archived projects yet.`
        );
        if (!confirmed) return;
        await archiveProject(project.id, true);
    };

    return (
        <Group
            x={project.x}
            y={project.y}
            draggable
            onMouseEnter={(e) => setStageCursor(e, 'grab')}
            onDragStart={(e) => { e.cancelBubble = true; setStageCursor(e, 'grabbing'); }}
            onDragEnd={(e) => {
                e.cancelBubble = true;
                setStageCursor(e, 'grab');
                updateProjectPosition(project.id, e.target.x(), e.target.y());
            }}
        >
            {/* Title block header */}
            <Rect width={project.width} height={HEADER_HEIGHT} fill={colors.headerBg} cornerRadius={[6, 6, 0, 0]} />
            <Text
                text={project.title.toUpperCase()}
                x={10} y={HEADER_HEIGHT / 2 - 6}
                fontSize={12} fontStyle="bold" fontFamily="Inter" letterSpacing={0.5}
                fill={headerTextColor}
                width={project.width - TIMESTAMP_COL_WIDTH - 60}
                ellipsis wrap="none"
            />
            <Line points={[project.width - TIMESTAMP_COL_WIDTH, 8, project.width - TIMESTAMP_COL_WIDTH, HEADER_HEIGHT - 8]} stroke="#3A4552" strokeWidth={1} />
            <Text
                text={`UPD ${formatRelativeTime(lastActivity)}`}
                x={project.width - TIMESTAMP_COL_WIDTH + 8} y={HEADER_HEIGHT / 2 - 5}
                fontSize={9} fontFamily="IBM Plex Mono" fill={headerTextColor} opacity={0.65} letterSpacing={0.3}
            />

            <AddItemButton
                x={project.width - TIMESTAMP_COL_WIDTH - 24}
                y={5}
                onClick={(e) => { e.cancelBubble = true; onRequestCreate(); }}
            />

            <ArchiveButton
                x={project.width - TIMESTAMP_COL_WIDTH - 54}
                y={5}
                iconOffsetX={7} 
                iconOffsetY={3}            
                onClick={handleArchive}
            />

            <EditButton
                x={project.width - TIMESTAMP_COL_WIDTH - 84}
                y={5}
                onClick={(e) => { e.cancelBubble = true; onRequestEditProject(project); }}
            />

            {/* Body */}
            <Rect y={HEADER_HEIGHT} width={project.width} height={bodyHeight} fill={colors.paper} cornerRadius={[0, 0, 6, 6]} />

            {/* Band dividers + labels */}
            {STATUSES.map((status, i) => (
                <Group key={status}>
                {i > 0 && <Rect x={i * bandWidth} y={HEADER_HEIGHT} width={1} height={bodyHeight} fill={colors.border} />}
                <Text
                    text={status.toUpperCase()}
                    x={i * bandWidth + 6} y={HEADER_HEIGHT + 6}
                    fontSize={8} fontFamily="IBM Plex Mono" letterSpacing={0.8} fill={colors.slate}
                />
                </Group>
            ))}

            {/* Outer border */}
            <Rect width={project.width} height={project.height} stroke={effectiveColor} strokeWidth={1.5} cornerRadius={6} listening={false} />

            {/* Cards */}
            {items.map((item) => (
                <Group
                    key={item.id}
                    x={item.x} y={item.y}
                    draggable
                    onMouseEnter={(e) => setStageCursor(e, 'grab')}
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
                    onDragStart={(e) => {
                        e.cancelBubble = true;
                        setStageCursor(e, 'grabbing');
                    }}
                    onDragEnd={(e) => {
                        e.cancelBubble = true;
                        setStageCursor(e, 'grab');
                        const localX = e.target.x();
                        const localY = e.target.y();
                        const newStatus = statusForLocalX(localX, project.width);
                        updateItemPosition(item.id, localX, localY, project.id, project.id);
                        if (newStatus !== item.status) updateItemStatus(item.id, item.status, newStatus);
                    }}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        onRequestEdit(item);
                    }}
                >
                    <Rect
                        width={CARD_WIDTH} height={CARD_HEIGHT} fill="#FFFFFF" stroke={colors.border} strokeWidth={1}
                        cornerRadius={4} shadowColor="#000000" shadowBlur={4} shadowOpacity={0.12} shadowOffset={{ x: 0, y: 1 }}
                    />
                    <Rect width={STRIPE_WIDTH} height={CARD_HEIGHT} fill={statusColors[item.status]} cornerRadius={[4, 0, 0, 4]} />
                    <Text
                        text={item.title} x={STRIPE_WIDTH + 8} y={10}
                        fontSize={10} fontFamily="Inter" fill={colors.ink}
                        width={CARD_WIDTH - STRIPE_WIDTH - 14} wrap="none" ellipsis
                    />
                </Group>
            ))}
        </Group>
    );
}