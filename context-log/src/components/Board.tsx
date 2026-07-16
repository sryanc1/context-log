import {Stage, Layer} from 'react-konva';
import {useProjects} from '../hooks/useProjects';
import {useItems} from '../hooks/useItems';
import { ProjectContainer } from './ProjectContainer';

export function Board() {
    const {projects, loading: projectsLoading} = useProjects();
    const {items, loading: itemsLoading} = useItems();

    if (projectsLoading || itemsLoading) {
        return (
            <div className="loading-screen">
                <p>Loading...</p>
            </div>
        );
    }

    const visibleProjects = projects.filter((p) => !p.archived);

    return (
        <Stage 
            width={window.innerWidth}
            height={window.innerHeight-40}
            draggable
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
    )
}