import { useEffect, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { useProjects } from '../hooks/useProjects';
import { useItems } from '../hooks/useItems';
import { ProjectContainer } from './ProjectContainer';

export interface Viewport { x: number; y: number; width: number; height: number;}

export function Board({ onViewportChange }: { onViewportChange: (v: Viewport) => void }) {
  const { projects, loading: projectsLoading } = useProjects();
  const { items, loading: itemsLoading } = useItems();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    onViewportChange({ ...stagePos, ...size });
  }, [stagePos, size, onViewportChange]);

  if (projectsLoading || itemsLoading) {
    return <p>Loading board...</p>;
  }

  const visibleProjects = projects.filter((p) => !p.archived);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Stage
        width={size.width}
        height={size.height}
        draggable
        onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
      >
        <Layer>
          {visibleProjects.map((project) => (
            <ProjectContainer
              key={project.id}
              project={project}
              items={items.filter((item) => item.containerId === project.id)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}