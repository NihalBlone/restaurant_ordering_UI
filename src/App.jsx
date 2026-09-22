import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLoginPage from "./pages/AdminLoginPage";
import CartPage from "./pages/CartPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import MenuPage from "./pages/MenuPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PlatformDashboardPage from "./pages/PlatformDashboardPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/menu" replace />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/track" element={<OrderTrackingPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/platform/login" element={<AdminLoginPage key="platform" platform />} />
      <Route path="/platform" element={<ProtectedRoute platform><PlatformDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  );
}

export default App;
