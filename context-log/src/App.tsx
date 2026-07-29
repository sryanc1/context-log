import { useCallback, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useProjects } from './hooks/useProjects';
import { useItems } from './hooks/useItems';
import { Login } from './components/Login';
import { Board, type Viewport, type FocusTarget } from './components/Board';
import { NavRail } from './components/NavRail';
import { Drawer } from './components/Drawer';
import { ArchiveView } from './components/ArchiveView';
import { ProjectModal, type ProjectFormValues } from './components/ProjectModal';
import { createProject, updateProject, archiveProject } from './services/firebase';
import { VIEWS, type ViewId } from './types/views';
import type { Project } from './types/items';

type ProjectModalState = { mode: 'create' } | { mode: 'edit'; project: Project } | null;

function App() {
  const { user, allowed, isAdmin, loading, logout } = useAuth();
  const uid = user?.uid ?? '';
  const { projects } = useProjects(uid);
  const { items } = useItems(uid);

  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, width: 0, height: 0, scale: 1 });
  const [projectModalState, setProjectModalState] = useState<ProjectModalState>(null);
  const [activeView, setActiveView] = useState<ViewId | null>(null);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

  const handleViewportChange = useCallback((v: Viewport) => setViewport(v), []);

  if (loading) return <div className="loading-screen"><p>Loading...</p></div>;
  if (!user) return <Login />;

  if (!allowed) {
    return (
      <div className="login-screen">
        <h1>context-log</h1>
        <p className="not-allowed-message">{user.email} isn't on the allowlist for this app yet.</p>
        <button onClick={logout}>Sign out</button>
      </div>
    );
  }

  const activeViewDef = VIEWS.find((v) => v.id === activeView);
  const archivedProjects = projects.filter((p) => p.archived);

  const handleSaveProject = async (values: ProjectFormValues) => {
    if (projectModalState?.mode === 'edit') {
      await updateProject(uid, projectModalState.project.id, values);
    } else {
      const worldCenterX = (viewport.width / 2 - viewport.x) / viewport.scale;
      const worldCenterY = (viewport.height / 2 - viewport.y) / viewport.scale;
      await createProject(uid, values, worldCenterX, worldCenterY);
    }
    setProjectModalState(null);
  };

  const handleRestoreProject = async (project: Project) => {
    await archiveProject(uid, project.id, false);
    setFocusTarget({ x: project.x + project.width / 2, y: project.y + project.height / 2 });
    setActiveView(null);
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>context-log</h1>
        <div className="topbar-user">
          <button onClick={() => setProjectModalState({ mode: 'create' })}>+ New project</button>
          <span>{user.email}</span>
          <button onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="app-shell">
        <NavRail
          activeView={activeView}
          onSelect={setActiveView}
          isAdmin={isAdmin}
          collapsed={railCollapsed}
          onToggleCollapsed={() => setRailCollapsed((c) => !c)}
        />

        <div className="board-area">
          <Board
            uid={uid}
            projects={projects}
            items={items}
            interactive={activeView === null}
            focusTarget={focusTarget}
            onFocusConsumed={() => setFocusTarget(null)}
            onViewportChange={handleViewportChange}
            onRequestEditProject={(project) => setProjectModalState({ mode: 'edit', project })}
          />

          <Drawer
            isOpen={activeView !== null}
            title={activeViewDef?.label ?? ''}
            onClose={() => setActiveView(null)}
          >
            {activeView === 'archive' && (
              <ArchiveView archivedProjects={archivedProjects} items={items} onRestore={handleRestoreProject} />
            )}
            {activeView && activeView !== 'archive' && (
              <p style={{ color: '#6B7280', fontSize: 13 }}>{activeViewDef?.label} view — coming soon.</p>
            )}
          </Drawer>
        </div>
      </div>

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