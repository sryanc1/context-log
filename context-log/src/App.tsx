import { useCallback, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import { Board, type Viewport } from './components/Board';
import { ProjectModal, type ProjectFormValues } from './components/ProjectModal';
import { createProject, updateProject } from './services/firebase';
import type { Project } from './types/items';
import { NavRail } from './components/NavRail';
import { Drawer } from './components/Drawer';
import { VIEWS, type ViewID } from './types/views';

type ProjectModalState = { mode: 'create' } | { mode: 'edit'; project: Project } | null;

function App() {
	const { user, allowed, isAdmin, loading, logout } = useAuth();
	const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, width: 0, height: 0, scale: 1 });
	const [projectModalState, setProjectModalState] = useState<ProjectModalState>(null);
	const [activeView, setActiveView] = useState<ViewID | null >(null);
	const [railCollapsed, setRailCollapsed] = useState(false);

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

	const uid = user.uid;
	const activeViewDef = VIEWS.find((v) => v.id === activeView);

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

			<div className='app-shell'>
				<NavRail
					activeView={activeView}
					onSelect={setActiveView}
					isAdmin={isAdmin}
					collapsed={railCollapsed}
					onToggleCollapsed={() => setRailCollapsed((c) => !c)}
				/>
				<Board
					uid={uid}
					interactive={activeView === null}
					onViewportChange={handleViewportChange}
					onRequestEditProject={(project) => setProjectModalState({mode: 'edit', project})}
				/>
				<Drawer
					isOpen={activeView !== null}
					title={activeViewDef?.label ?? ''}
					onClose={() => setActiveView(null)}
				>
					<p style={{color: '#6B7280', fontSize: 13}}>
						{activeViewDef?.label} view - coming soon.
					</p>
				</Drawer>

			</div>
			{/* <main className="app-body">
				<Board
					uid={uid}
					onViewportChange={handleViewportChange}
					onRequestEditProject={(project) => setProjectModalState({ mode: 'edit', project })}
				/>
			</main> */}

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