// src/components/ProjectContainer.tsx

import { Group, Rect, Text } from 'react-konva';
import type { Item, ItemStatus, Project } from '../types/items';
import { updateProjectPosition, updateItemPosition, updateItemStatus, createItem } from '../services/firebase';

const HEADER_HEIGHT = 32;
const STATUSES: ItemStatus[] = ['backlog', 'active', 'waiting', 'completed'];
const CARD_WIDTH = 100;
const CARD_HEIGHT = 36;

function statusForLocalX(localX: number, containerWidth: number): ItemStatus {
    const bandWidth = containerWidth / 4;
    const index = Math.min(3, Math.max(0, Math.floor(localX / bandWidth)));
    return STATUSES[index];
}

export function ProjectContainer({ project, items }: { project: Project; items: Item[] }) {
    const bodyHeight = project.height - HEADER_HEIGHT;
    const bandWidth = project.width / 4;

    const handleAddItem = async () => {
        const title = window.prompt('New item title:');
        if (!title) return;

        // Cascade new cards slightly so repeated adds don't land exactly on top of each other
        const backlogCount = items.filter((i) => i.status === 'backlog').length;
        const offset = (backlogCount % 6) * 14;

        await createItem({
        title,
        description: '',
        type: 'task',
        status: 'backlog',
        priority: 'medium',
        tags: [],
        containerId: project.id,
        x: 8 + offset,
        y: 8 + offset,
        });
    };

    return (
        <Group
        x={project.x}
        y={project.y}
        draggable
        onDragEnd={(e) => {
            updateProjectPosition(project.id, e.target.x(), e.target.y());
        }}
        >
        {/* Header — drag handle */}
        <Rect width={project.width} height={HEADER_HEIGHT} fill="#2c2c2a" cornerRadius={[8, 8, 0, 0]} />
        <Text text={project.title} x={10} y={8} fontSize={13} fill="#ffffff" />

        {/* Add item button */}
        <Group
            x={project.width - 28}
            y={4}
            onClick={(e) => {
            e.cancelBubble = true;
            handleAddItem();
            }}
            onTap={(e) => {
            e.cancelBubble = true;
            handleAddItem();
            }}
        >
            <Rect width={24} height={24} fill="#ffffff20" cornerRadius={4} />
            <Text text="+" x={8} y={3} fontSize={16} fill="#ffffff" />
        </Group>

        {/* Body background */}
        <Rect y={HEADER_HEIGHT} width={project.width} height={bodyHeight} fill="#f1efe8" />

        {/* Band dividers + labels */}
        {STATUSES.map((status, i) => (
            <Group key={status}>
            {i > 0 && (
                <Rect x={i * bandWidth} y={HEADER_HEIGHT} width={1} height={bodyHeight} fill="#d3d1c7" />
            )}
            <Text
                text={status}
                x={i * bandWidth + 6}
                y={HEADER_HEIGHT + 4}
                fontSize={9}
                fill="#8a8880"
            />
            </Group>
        ))}

        {/* Cards */}
        {items.map((item) => (
            <Group
            key={item.id}
            x={item.x}
            y={item.y}
            draggable
            dragBoundFunc={function (pos) {
                const parent = this.getParent();
                const containerAbs = parent ? parent.getAbsolutePosition() : { x: 0, y: 0 };
                const localX = pos.x - containerAbs.x;
                const localY = pos.y - containerAbs.y - HEADER_HEIGHT;
                const clampedX = Math.max(0, Math.min(project.width - CARD_WIDTH, localX));
                const clampedY = Math.max(0, Math.min(bodyHeight - CARD_HEIGHT, localY));
                return {
                x: containerAbs.x + clampedX,
                y: containerAbs.y + HEADER_HEIGHT + clampedY,
                };
            }}
            onDragEnd={(e) => {
                e.cancelBubble = true;
                const localX = e.target.x();
                const localY = e.target.y();
                const newStatus = statusForLocalX(localX, project.width);
                updateItemPosition(item.id, localX, localY, project.id, project.id);
                if (newStatus !== item.status) {
                updateItemStatus(item.id, item.status, newStatus);
                }
            }}
            >
            <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="#0F6E56" cornerRadius={6} />
            <Text text={item.title} x={6} y={10} fontSize={10} fill="#ffffff" width={CARD_WIDTH - 12} />
            </Group>
        ))}
        </Group>
    );
}