import { useState } from 'react'
import './App.css'
import { DashboardShell } from './components/DashboardShell'
import { useTaskWorkflow } from './hooks/useTaskWorkflow'
import { AgentsPage } from './pages/AgentsPage'
import { CreateTaskPage } from './pages/CreateTaskPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { LogsPage } from './pages/LogsPage'

function App() {
  const [activePage, setActivePage] = useState('home')
  const workflow = useTaskWorkflow()

  function handleTaskCompleted() {
    setActivePage('dashboard')
  }

  return (
    <DashboardShell activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'home' ? <LandingPage onNavigate={setActivePage} /> : null}
      {activePage === 'create' ? (
        <CreateTaskPage workflow={workflow} onCompleted={handleTaskCompleted} />
      ) : null}
      {activePage === 'dashboard' ? <DashboardPage workflow={workflow} /> : null}
      {activePage === 'agents' ? <AgentsPage workflow={workflow} /> : null}
      {activePage === 'logs' ? <LogsPage workflow={workflow} /> : null}
    </DashboardShell>
  )
}

export default App
