import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logotipo from '@/assets/logos/logotipo.png';

type Mode = 'login' | 'register' | 'forgot';

export const LoginPage: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (mode === 'register' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSubmitting(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error)
      else navigate('/dashboard')
    } else if (mode === 'register') {
      const { error } = await signUp(email, password)
      if (error) setError(error)
      else setSuccess('Revisá tu email para confirmar tu cuenta.')
    } else {
      const { error } = await resetPassword(email)
      if (error) setError(error)
      else setSuccess('Te enviamos un email con las instrucciones.')
    }

    setSubmitting(false)
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="h-screen w-screen bg-dashboard-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-panel-bg border border-panel-border rounded-2xl p-8 shadow-2xl">

          {/* Título */}
          <div className="text-center mb-8">
            <img src={logotipo} alt="StreamGrid" className="h-16 mx-auto" />
            <p className="text-gray-500 text-sm mt-2">
              {mode === 'login' && 'Ingresá a tu dashboard'}
              {mode === 'register' && 'Creá tu cuenta'}
              {mode === 'forgot' && 'Recuperá tu contraseña'}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                required
                className="w-full bg-dashboard-bg border border-panel-border rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-cyan transition-colors"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  className="w-full bg-dashboard-bg border border-panel-border rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  className="w-full bg-dashboard-bg border border-panel-border rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right -mt-1">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-gray-500 text-xs hover:text-brand-cyan transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {success && (
              <p className="text-brand-cyan text-xs bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-brand-pink to-brand-cyan text-white font-semibold py-3 rounded-lg transition-opacity hover:opacity-90 mt-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Procesando...' : (
                <>
                  {mode === 'login' && 'Iniciar sesión'}
                  {mode === 'register' && 'Crear cuenta'}
                  {mode === 'forgot' && 'Enviar instrucciones'}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-panel-border" />
            <span className="text-gray-600 text-xs">o</span>
            <div className="flex-1 h-px bg-panel-border" />
          </div>

          {/* Footer links */}
          <p className="text-center text-gray-500 text-sm">
            {mode === 'login' && (
              <>
                ¿No tenés cuenta?{' '}
                <button
                  onClick={() => switchMode('register')}
                  className="text-brand-cyan hover:text-brand-pink font-medium transition-colors cursor-pointer"
                >
                  Registrarte
                </button>
              </>
            )}
            {(mode === 'register' || mode === 'forgot') && (
              <>
                ¿Ya tenés cuenta?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-brand-cyan hover:text-brand-pink font-medium transition-colors cursor-pointer"
                >
                  Iniciá sesión
                </button>
              </>
            )}
          </p>
        </div>

      </div>
    </div>
  );
};
