import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Audit from './pages/Audit.jsx'
import Results from './pages/Results.jsx'
import LiveAgent from './components/templates/live-agent/Light.jsx'
import { useTheme } from './context/ThemeContext.jsx'
import LiveAgentDark from './components/templates/live-agent/Dark.jsx'

function App() {
  const { theme } = useTheme()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/audit" element={<Audit />} />
      <Route path="/results" element={<Results />} />
      <Route path="/live-agent" element={theme === 'dark' ? <LiveAgentDark /> : <LiveAgent />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
