import { useCallback, useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useProjects } from './hooks/useProjects';
import { useItems } from './hooks/useItems';
import { Login } from './components/Login';
import { Board, type Viewport, type FocusTarget } from './components/Board';
import { NavRail } from './components/NavRail';
import { Drawer } from './components/Drawer';
import { ArchiveView } from './components/ArchiveView';
import { ProjectModal, type ProjectFormValues } from './components/ProjectModal';
import { createProject, updateProject, archiveProject, deleteProject } from './services/firebase';
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
import { SearchView } from './components/SearchView';
import { useInactivityTimeout } from './hooks/useInactivityTimeout';
import { useUserSettings } from './hooks/useUserSettings';
import { SettingsModal } from './components/SettingsModal';
import { updateUserSettings } from './services/firebase';
import type { UserSettings } from './types/settings';
import type { Project } from './types/items';

type ProjectModalState = { mode: 'create' } | { mode: 'edit'; project: Project } | null;

function App() {
	const { user, allowed, isAdmin, loading, logout } = useAuth();
	const uid = user?.uid ?? '';
	const { projects, loading: projectsLoading } = useProjects(uid);
	const { items, loading: itemsLoading } = useItems(uid);
	const {entries: activityEntries} = useActivityFeed(uid);
	const {entries: allowlistEntries} = useAllowlist(isAdmin);
	const {permissionState, subscribed, requestPermission, disableNotifications, toast, dismissToast} = useNotifications(uid);	

	const [requestedItemId, setRequestedItemId] = useState<string | null>(null)
	const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, width: 0, height: 0, scale: 1 });
	const [projectModalState, setProjectModalState] = useState<ProjectModalState>(null);
	const [activeView, setActiveView] = useState<ViewId | null>(null);
	const [railCollapsed, setRailCollapsed] = useState(false);
	const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

	const handleViewportChange = useCallback((v: Viewport) => setViewport(v), []);

	const hasAutoOpenedNotifCenter = useRef(false);
	const [notifCenterOpen, setNotifCenterOpen] = useState(false);

	const [settingsOpen, setSettingsOpen] = useState(false);
	const { settings: userSettings, loading: settingsLoading } = useUserSettings(uid);
	const hasSyncedTimezone = useRef(false);

	useEffect(() => {
		if (!uid || settingsLoading || hasSyncedTimezone.current) return;
		const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (detected && detected !== userSettings.timezone) {
			updateUserSettings(uid, { timezone: detected });
		}
		hasSyncedTimezone.current = true;
	}, [uid, settingsLoading, userSettings.timezone]);

	useInactivityTimeout(logout, userSettings.inactivityTimeoutMinutes * 60 * 1000, !!user && allowed);

	useEffect(() => {
		if (!uid) {
			hasAutoOpenedNotifCenter.current = false; // logged out — allow the next login to trigger this again
			return;
		}
		if (hasAutoOpenedNotifCenter.current || itemsLoading || projectsLoading || !allowed) return;
		hasAutoOpenedNotifCenter.current = true;

		const archivedIds = new Set(projects.filter((p) => p.archived).map((p) => p.id));
		const urgent = getUrgentItems(items, archivedIds);
		if (urgent.length > 0) setNotifCenterOpen(true);
	}, [uid, itemsLoading, projectsLoading, allowed, items, projects]);

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
		setFocusTarget({ x: project.x + project.width / 2, y: project.y + project.height / 2, projectId: project.id });
		setActiveView(null);
	};

	const handleFocusAndOpenItem = (itemId: string) => {
		const item = items.find((i) => i.id === itemId);
		const project = item ? projects.find((p) => p.id === item.containerId) :undefined;
		if (item && project && !project.archived) {
			setFocusTarget({ x: project.x + project.width / 2, y: project.y + project.height / 2, projectId: project.id });
		}
		setRequestedItemId(itemId);
		setActiveView(null);
	}

	const archivedProjectIds = new Set(projects.filter((p) => p.archived).map((p)=> p.id));
	const handleDeleteProject = async (project: Project) => {
		await deleteProject(uid, project.id);
	};
	const urgentItems = getUrgentItems(items, archivedProjectIds);
	const todayItems = getTodayItems(items, archivedProjectIds)

	// handler for clicking a project result directly (no item involved):
	const handleSelectProjectFromSearch = (project: Project) => {
		if (!project.archived) {
			setFocusTarget({ x: project.x + project.width / 2, y: project.y + project.height / 2, projectId: project.id });
		}
		setActiveView(null);
	};

	return (
		<div className="app">
			<header className="topbar">
				<h1>context-log</h1>
				<div className="topbar-user">
					<NotificationBell subscribed={subscribed} onClick={() => setSettingsOpen(true)} />
					<NotificationCenter
						urgentItems={urgentItems}
						projects={projects}
						onSelectItem={handleFocusAndOpenItem}
						isOpen={notifCenterOpen}
						onOpenChange={setNotifCenterOpen}
					/>
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
							<ArchiveView archivedProjects={archivedProjects} items={items} onRestore={handleRestoreProject} onDelete={handleDeleteProject} />
						)}
						{activeView === 'timeline' &&(
							<TimelineView entries={activityEntries} items={items} projects={projects} onSelectItem={handleFocusAndOpenItem}/>
						)}
						{activeView === 'search' && (
							<SearchView items={items} projects={projects} onSelectItem={handleFocusAndOpenItem} onSelectProject={handleSelectProjectFromSearch} />
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
						{activeView && !['archive', 'timeline', 'admin', 'today', 'search'].includes(activeView) && (
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
			{settingsOpen && (
				<SettingsModal
					settings={userSettings}
					permissionState={permissionState}
					subscribed={subscribed}
					onTogglePush={() => (subscribed ? disableNotifications() : requestPermission())}
					onSave={async (newSettings: UserSettings) => {
					await updateUserSettings(uid, newSettings);
					setSettingsOpen(false);
					}}
					onCancel={() => setSettingsOpen(false)}
				/>
			)}
		</div>
	);
}

export default App;