// src/utils/cursor.ts
import type Konva from 'konva';

export function setStageCursor(e: Konva.KonvaEventObject<Event>, cursor: string) {
  const stage = e.target.getStage();
  if (stage) stage.container().style.cursor = cursor;
}