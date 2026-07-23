import { useState } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import { colors } from '../theme';

interface AddItemButtonProps {
  x: number;
  y: number;
  onClick: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  iconOffsetX?: number;
  iconOffsetY?: number;
}

export function AddItemButton({ x, y, onClick, iconOffsetX = 7, iconOffsetY = 2 }: AddItemButtonProps) {
  const [hovered, setHovered] = useState(false);
  const setCursor = (cursor: string) => (e: Konva.KonvaEventObject<MouseEvent> ) => {
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
      <Rect width={22} height={22} fill={hovered ? colors.successBgHover : colors.successBg} cornerRadius={4} />
      <Text text="+" x={iconOffsetX} y={iconOffsetY} fontSize={15} fontStyle="bold" fill={colors.successIcon} />
    </Group>
  );
}