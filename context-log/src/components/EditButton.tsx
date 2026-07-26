import { useState } from "react";
import { Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import {colors} from '../theme'
import { setStageCursor } from "../utils/cursor";

interface EditButtonProps {
    x: number;
    y: number;
    onClick: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent> ) => void;
    iconOffsetX?: number;
    iconOffsetY?: number;
}

export function EditButton({ x, y, onClick, iconOffsetX = 5, iconOffsetY = 5 }: EditButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Group
      x={x} y={y}
      onClick={onClick}
      onTap={onClick}
      onMouseEnter={(e) => { setHovered(true); setStageCursor(e, 'pointer'); }}
      onMouseLeave={(e) => { setHovered(false); setStageCursor(e, 'grab'); }}
    >
      <Rect width={22} height={22} fill={hovered ? colors.neutralBgHover : colors.neutralBg} cornerRadius={4} />
      <Text text="✎" x={iconOffsetX} y={iconOffsetY} fontSize={12} fill={colors.neutralIcon} />
    </Group>
  );
}