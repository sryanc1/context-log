import { useCallback, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import {Board, type Viewport} from './components/Board';
import { createProject } from './services/firebase';

function App() {
  const { user, loading, logout } = useAuth();
  const [creating, setCreating] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ x:0, y:0, width:0, height:0})
  
  const handelViewportChange = useCallback((v: Viewport) => setViewport(v), []);

  if(loading) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if(!user) {
    return <Login />;
  }

  const handleNewProject = async () => {
    setCreating(true)
    try {
      const worldCenterX = viewport.width /2 - viewport.x;
      const worldCenterY = viewport.width /2 - viewport.y
      await createProject('New project', worldCenterX, worldCenterY);      
    } finally {
      setCreating(false)      
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>context-log</h1>
        <div className="topbar-user">
          <button onClick={handleNewProject} disabled={creating}>
            {creating ? 'Creating...' : '+ New project'}
          </button>
          <span>{user.email}</span>
          <button onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="app-body">
        <Board onViewportChange={handelViewportChange}/>
      </main>
    </div>
  );
}

export default App;