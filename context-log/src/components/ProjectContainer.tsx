import { Group, Rect, Text, Line } from 'react-konva';
import type { Item, ItemStatus, Project } from '../types/items';
import { updateProjectPosition, updateItemPosition, updateItemStatus, createItem } from '../services/firebase';
import { colors, statusColors } from '../theme';
import { formatRelativeTime } from '../utils/time';

const HEADER_HEIGHT = 34;
const STATUSES: ItemStatus[] = ['backlog', 'active', 'waiting', 'completed'];
const CARD_WIDTH = 100;
const CARD_HEIGHT = 36;
const STRIPE_WIDTH = 4;
const TIMESTAMP_COL_WIDTH = 90;

function statusForLocalX(localX: number, containerWidth: number): ItemStatus {
    const bandWidth = containerWidth / 4;
    const index = Math.min(3, Math.max(0, Math.floor(localX / bandWidth)));
    return STATUSES[index];
}

export function ProjectContainer({ project, items }: { project: Project; items: Item[] }) {
    const bodyHeight = project.height - HEADER_HEIGHT;
    const bandWidth = project.width / 4;
    const itemTimestamps = items.map((i) => i.updatedAt);
    const lastActivity = itemTimestamps.length ? Math.max(...itemTimestamps) : project.createdAt;

    const handleAddItem = async () => {
        const title = window.prompt('New item title:');
        if (!title) return;
        const backlogCount = items.filter((i) => i.status === 'backlog').length;
        const offset = (backlogCount % 6) * 14;
        await createItem({
        title, description: '', type: 'task', status: 'backlog', priority: 'medium',
        tags: [], containerId: project.id, x: 8 + offset, y: 8 + offset,
        });
    };

    return (
        <Group
        x={project.x}
        y={project.y}
        draggable
        onDragEnd={(e) => {
            e.cancelBubble = true;
            updateProjectPosition(project.id, e.target.x(), e.target.y());
        }}
        >
        {/* Title block header */}
        <Rect width={project.width} height={HEADER_HEIGHT} fill={colors.headerBg} cornerRadius={[6, 6, 0, 0]} />
        <Text
            text={project.title.toUpperCase()}
            x={10} y={HEADER_HEIGHT / 2 - 6}
            fontSize={12} fontStyle="bold" fontFamily="Inter" letterSpacing={0.5}
            fill="#FFFFFF"
            width={project.width - TIMESTAMP_COL_WIDTH - 30}
            ellipsis wrap="none"
        />
        <Line points={[project.width - TIMESTAMP_COL_WIDTH, 8, project.width - TIMESTAMP_COL_WIDTH, HEADER_HEIGHT - 8]} stroke="#3A4552" strokeWidth={1} />
        <Text
            text={`UPD ${formatRelativeTime(lastActivity)}`}
            x={project.width - TIMESTAMP_COL_WIDTH + 8} y={HEADER_HEIGHT / 2 - 5}
            fontSize={9} fontFamily="IBM Plex Mono" fill="#A9B4C0" letterSpacing={0.3}
        />

        {/* Add item button */}
        <Group
            x={project.width - TIMESTAMP_COL_WIDTH - 24} y={5}
            onClick={(e) => { e.cancelBubble = true; handleAddItem(); }}
            onTap={(e) => { e.cancelBubble = true; handleAddItem(); }}
        >
            <Rect width={22} height={22} fill="#ffffff18" cornerRadius={4} />
            <Text text="+" x={7} y={2} fontSize={15} fill="#FFFFFF" />
        </Group>

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
        <Rect width={project.width} height={project.height} stroke={colors.border} strokeWidth={1} cornerRadius={6} listening={false} />

        {/* Cards */}
        {items.map((item) => (
            <Group
            key={item.id}
            x={item.x} y={item.y}
            draggable
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
            onDragEnd={(e) => {
                e.cancelBubble = true;
                const localX = e.target.x();
                const localY = e.target.y();
                const newStatus = statusForLocalX(localX, project.width);
                updateItemPosition(item.id, localX, localY, project.id, project.id);
                if (newStatus !== item.status) updateItemStatus(item.id, item.status, newStatus);
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