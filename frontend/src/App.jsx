import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AssetExplorer from './pages/AssetExplorer';
import EquipmentProfile from './pages/EquipmentProfile';
import Timeline from './pages/Timeline';
import Copilot from './pages/Copilot';
import Insights from './pages/Insights';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        {/* Application Routes — protected by localStorage auth flag */}
        <Route path="/app" element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="assets" element={<AssetExplorer />} />
            <Route path="equipment/:id" element={<EquipmentProfile />} />
            <Route path="equipment/:id/timeline" element={<Timeline />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="copilot" element={<Copilot />} />
            <Route path="insights" element={<Insights />} />
          </Route>
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
