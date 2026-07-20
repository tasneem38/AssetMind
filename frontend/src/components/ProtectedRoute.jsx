import { Navigate, Outlet } from 'react-router-dom';

/**
 * Protects /app/* routes. Checks localStorage for 'auth' flag set on login.
 * This is a demo-grade guard — not backed by real JWT — but prevents direct
 * URL navigation from bypassing the login page entirely.
 */
const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem('auth') === 'true';
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
