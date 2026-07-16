import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';

function App() {
  const { user, loading, logout } = useAuth();

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

  return (
    <div className="app">
      <header className="topbar">
        <h1>context-log</h1>
        <div className="topbar-user">
          <span>{user.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="app-body">
        {/* Main content goes here */}
        <p>Board coming next.</p>
      </main>
    </div>
  )
}

export default App;