import { useCallback, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import { Board, type Viewport } from './components/Board';
import { ProjectModal, type ProjectFormValues } from './components/ProjectModal';
import { createProject, updateProject } from './services/firebase';
import type { Project } from './types/items';

type ProjectModalState = { mode: 'create' } | { mode: 'edit'; project: Project } | null;

function App() {
  const { user, loading, logout } = useAuth();
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, width: 0, height: 0, scale: 1 });
  const [projectModalState, setProjectModalState] = useState<ProjectModalState>(null);

  const handleViewportChange = useCallback((v: Viewport) => setViewport(v), []);

  if (loading) return <div className="loading-screen"><p>Loading...</p></div>;
  if (!user) return <Login />;

  const handleSaveProject = async (values: ProjectFormValues) => {
    if (projectModalState?.mode === 'edit') {
      await updateProject(projectModalState.project.id, values);
    } else {
      const worldCenterX = (viewport.width / 2 - viewport.x) / viewport.scale;
      const worldCenterY = (viewport.height / 2 - viewport.y) / viewport.scale;
      await createProject(values, worldCenterX, worldCenterY);
    }
    setProjectModalState(null);
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>context-log</h1>
        <div className="topbar-user">
          <button onClick={() => setProjectModalState({ mode: 'create' })}>
            + New project
          </button>
          <span>{user.email}</span>
          <button onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="app-body">
        <Board
          onViewportChange={handleViewportChange}
          onRequestEditProject={(project) => setProjectModalState({ mode: 'edit', project })}
        />
      </main>

      {projectModalState && (
        <ProjectModal
          mode={projectModalState.mode}
          initialProject={projectModalState.mode === 'edit' ? projectModalState.project : undefined}
          onCancel={() => setProjectModalState(null)}
          onSave={handleSaveProject}
        />
      )}
    </div>
  );
}

export default App;