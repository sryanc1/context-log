import { useState} from 'react';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import {Board} from './components/Board';
import { createProject } from './services/firebase';

function App() {
  const { user, loading, logout } = useAuth();
  const [creating, setCreating] = useState(false);

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
      // Rough "somewhere visible" default - refinded below
      await createProject('New project', 100, 100);      
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
        <Board />
      </main>
    </div>
  );
}

export default App;