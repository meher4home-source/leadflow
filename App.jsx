import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import DashboardLayout from './pages/DashboardLayout'
import Dashboard from './pages/Dashboard'
import LeadsPage from './pages/LeadsPage'
import PropertiesPage from './pages/PropertiesPage'
import CallsPage from './pages/CallsPage'
import AIQualifier from './pages/AIQualifier'
import EmployeesPage from './pages/EmployeesPage'
import SettingsPage from './pages/SettingsPage'
import PricingPage from './pages/PricingPage'
import LandingPage from './pages/LandingPage'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:14,color:'#94a3b8'}}>Loading…</div>
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/" element={<Protected><DashboardLayout /></Protected>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="calls" element={<CallsPage />} />
        <Route path="qualify" element={<AIQualifier />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
