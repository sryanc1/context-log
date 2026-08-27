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
import { useActivityFeed} from './hooks/useActivityFeed';
import { TimelineView } from './components/TimelineView';
import { useAllowlist } from './hooks/useAllowList';
import { AdminView } from './components/AdminView';
import { addAllowListEntry, removeAllowlistEnry, setAllowlistAdmin } from './services/firebase';
import { Toast } from './components/Toast';
import { useNotifications } from './hooks/useNotifications';
import { NotificationBell } from './components/NitoficationBell';
import { NotificationCenter } from './components/NotificationCenter';
import { getUrgentItems } from './utils/dueDate';
import { TodayView } from './components/TodayView';
import { getTodayItems } from './utils/dueDate';
import type { Project } from './types/items';


type ProjectModalState = { mode: 'create' } | { mode: 'edit'; project: Project } | null;

function App() {
	const { user, allowed, isAdmin, loading, logout } = useAuth();
	const uid = user?.uid ?? '';
	const { projects } = useProjects(uid);
	const { items } = useItems(uid);
	const {entries: activityEntries} = useActivityFeed(uid);
	const {entries: allowlistEntries} = useAllowlist(isAdmin);
	const {permissionState, requestPermission, toast, dismissToast} = useNotifications(uid);	

	const [requestedItemId, setRequestedItemId] = useState<string | null>(null)
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

	const handleFocusAndOpenItem = (itemId: string) => {
		const item = items.find((i) => i.id === itemId);
		const project = item ? projects.find((p) => p.id === item.containerId) :undefined;
		if (item && project && !project.archived) {
			setFocusTarget({ x: project.x + project.width /2, y: project.y + project.height / 2})
		}
		setRequestedItemId(itemId);
		setActiveView(null);
	}

	const archivedProjectIds = new Set(projects.filter((p) => p.archived).map((p)=> p.id));
	const urgentItems = getUrgentItems(items, archivedProjectIds);
	const todayItems = getTodayItems(items, archivedProjectIds)

	const handelBellClick = () => {
		if (permissionState === 'denied') {
			window.alert("Noritications are blocked for this site, Check your browser's site settings to allow them, then reload.");			
		} else if (permissionState === 'default') {
			requestPermission();
		}
	}

	return (
		<div className="app">
			<header className="topbar">
				<h1>context-log</h1>
				<div className="topbar-user">
					<NotificationBell state={permissionState} onClick={handelBellClick}/>
					<NotificationCenter urgentItems={urgentItems} projects={projects} onSelectItem={handleFocusAndOpenItem}/>
					<button className="topbar-action" onClick={() => setProjectModalState({ mode: 'create' })}>+ New project</button>
					<span className="topbar-user-email">{user.email}</span>
					<button className="topbar-action" onClick={logout}>Sign out</button>
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
						requestedItemId={requestedItemId}
						onrequestedItemConsumed={() => setRequestedItemId(null)}
					/>

					<Drawer
						isOpen={activeView !== null}
						title={activeViewDef?.label ?? ''}
						onClose={() => setActiveView(null)}
					>
						{activeView === 'today' && (
							<TodayView items={todayItems} projects={projects} onSelectItem={handleFocusAndOpenItem} />							
						)}
						{activeView === 'archive' && (
							<ArchiveView archivedProjects={archivedProjects} items={items} onRestore={handleRestoreProject}/>
						)}
						{activeView === 'timeline' &&(
							<TimelineView entries={activityEntries} items={items} projects={projects} onSelectItem={handleFocusAndOpenItem}/>
						)}
						{activeView === 'admin' && (
							<AdminView
								entries={allowlistEntries}
								currentUserEmail={user.email ?? ''}
								onAdd={(email, notes, grantAdmin) => addAllowListEntry(email, notes, grantAdmin)}
								onRemove={(email) => removeAllowlistEnry(email)}
								onTggleAdmin={(email, adminValue) => setAllowlistAdmin(email, adminValue)}
							/>
						)}
						{activeView && !['archive', 'timeline', 'admin', 'today'].includes(activeView) && (
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

			{toast && <Toast title={toast.title} body={toast.body} onDismiss={dismissToast}/>}
		</div>
	);
}

export default App;