import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SettingsProvider } from "@/context/SettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import { GuestDataProvider } from "@/context/GuestDataContext";
import { BackendDataProvider } from "@/context/BackendDataContext";
import { AppActionsProvider } from "@/context/AppActionsContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute";
import { ToastContainer } from "@/components/ui/Toast";
import { AppModals } from "@/components/modals/AppModals";
import { LandingPage } from "@/pages/LandingPage";
import { WorkflowsPage } from "@/pages/WorkflowsPage";
import { LoginPage } from "@/pages/LoginPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ReservationsPage } from "@/pages/ReservationsPage";
import { CheckInOutPage } from "@/pages/CheckInOutPage";
import { GuestsPage } from "@/pages/GuestsPage";
import { AIPage } from "@/pages/AIPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { ServicesPage } from "@/pages/ServicesPage";
import { CommunicationsPage } from "@/pages/CommunicationsPage";
import { MultiHotelPage } from "@/pages/MultiHotelPage";
import { SecurityPage } from "@/pages/SecurityPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { UserManagementPage } from "@/pages/UserManagementPage";
import { FeedbackPage } from "@/pages/FeedbackPage";
import { DiningPage } from "@/pages/DiningPage";
import { RoleGate } from "@/components/auth/RoleGate";

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <GuestDataProvider>
          <AppActionsProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <PublicOnlyRoute>
                    <LandingPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <RegisterPage />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/workflows" element={<WorkflowsPage />} />

              <Route element={<ProtectedRoute />}>
                <Route
                  element={
                    <BackendDataProvider>
                      <AppLayout />
                      <AppModals />
                    </BackendDataProvider>
                  }
                >
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="reservations" element={<ReservationsPage />} />
                  <Route path="check-in-out" element={<CheckInOutPage />} />
                  <Route
                    path="guests"
                    element={
                      <RoleGate roles={["admin", "management", "receptionist"]}>
                        <GuestsPage />
                      </RoleGate>
                    }
                  />
                  <Route path="ai-personalization" element={<AIPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="services" element={<ServicesPage />} />
                  <Route path="dining" element={<DiningPage />} />
                  <Route path="analytics" element={<Navigate to="/reports" replace />} />
                  <Route
                    path="reports"
                    element={
                      <RoleGate roles={["admin", "management", "finance", "receptionist", "staff"]}>
                        <ReportsPage />
                      </RoleGate>
                    }
                  />
                  <Route path="communications" element={<CommunicationsPage />} />
                  <Route
                    path="feedback"
                    element={
                      <RoleGate roles={["admin", "management", "receptionist", "guest"]}>
                        <FeedbackPage />
                      </RoleGate>
                    }
                  />
                  <Route path="multi-hotel" element={<MultiHotelPage />} />
                  <Route
                    path="user-management"
                    element={
                      <RoleGate roles={["admin", "management"]}>
                        <UserManagementPage />
                      </RoleGate>
                    }
                  />
                  <Route path="security" element={<SecurityPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Route>
            </Routes>
            <ToastContainer />
          </AppActionsProvider>
          </GuestDataProvider>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}
