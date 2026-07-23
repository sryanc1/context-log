import { useState } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import { colors } from '../theme';

interface ArchiveButtonProps {
  x: number;
  y: number;
  onClick: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  iconOffsetX?: number;
  iconOffsetY?: number;
}

export function ArchiveButton({ x, y, onClick, iconOffsetX = 4, iconOffsetY = 3 }: ArchiveButtonProps) {
  const [hovered, setHovered] = useState(false);
  const setCursor = (cursor: string) => (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (stage) stage.container().style.cursor = cursor;
  };

  return (
    <Group
      x={x} y={y}
      onClick={onClick}
      onTap={onClick}
      onMouseEnter={(e) => { setHovered(true); setCursor('pointer')(e); }}
      onMouseLeave={(e) => { setHovered(false); setCursor('default')(e); }}
    >
      <Rect width={22} height={22} fill={hovered ? colors.dangerBgHover : colors.dangerBg} cornerRadius={4} />
      <Text text="x" x={iconOffsetX} y={iconOffsetY} fontSize={13} fill={colors.dangerIcon} />
    </Group>
  );
}