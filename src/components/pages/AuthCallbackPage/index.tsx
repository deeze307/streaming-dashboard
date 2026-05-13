import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate(data.session ? '/dashboard' : '/login', { replace: true })
    })
  }, [navigate])

  return (
    <div className="h-screen w-screen bg-dashboard-bg flex items-center justify-center">
      <div className="text-gray-400 text-sm">Verificando sesión...</div>
    </div>
  )
}
