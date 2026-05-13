import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { UserConfigProvider } from '@/contexts/UserConfigContext'
import { StreamProvider } from '@/contexts/StreamContext'
import { ProtectedRoute } from '@/components/templates/ProtectedRoute'
import { LoginPage } from '@/components/pages/LoginPage'
import { SettingsPage } from '@/components/pages/SettingsPage'
import { AuthCallbackPage } from '@/components/pages/AuthCallbackPage'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { VideoPlayer } from '@/components/organisms/VideoPlayer'
import { StatsPanel } from '@/components/organisms/StatsPanel'
import { MultiChat } from '@/components/organisms/MultiChat'
import { ActivityPanel } from '@/components/organisms/ActivityPanel'

const Dashboard: React.FC = () => (
  <StreamProvider>
    <DashboardLayout
      topLeft={<VideoPlayer />}
      topRight={<MultiChat />}
      bottomLeft={<StatsPanel />}
      bottomRight={<ActivityPanel />}
    />
  </StreamProvider>
)

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserConfigProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </UserConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
