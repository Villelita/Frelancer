'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('userEmail');
    if (token && role) {
      if (email === 'admin@nutrition.com') {
        router.push('/dashboard/admin');
      } else if (role === 'USER_PACIENTE') {
        router.push('/dashboard/patient');
      } else if (role === 'ADMIN_NUTRIOLOGO') {
        router.push('/dashboard/nutri');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al iniciar sesión.');
      }

      const data = await response.json();
      
      // Guardar sesión localmente
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('profileId', data.user.profileId);
      localStorage.setItem('userName', data.user.nombre);
      localStorage.setItem('userEmail', data.user.email);
      if (data.user.plan) {
        localStorage.setItem('plan', data.user.plan);
      }

      if (data.user.email === 'admin@nutrition.com') {
        router.push('/dashboard/admin');
      } else if (data.user.role === 'USER_PACIENTE') {
        router.push('/dashboard/patient');
      } else if (data.user.role === 'ADMIN_NUTRIOLOGO') {
        router.push('/dashboard/nutri');
      } else {
        setError('Rol de usuario desconocido.');
        localStorage.clear();
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Fondos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Card de Login Glassmorphism */}
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl shadow-slate-950/80 relative z-10 transition hover:border-slate-700/60 duration-300">
        
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-3.5 bg-gradient-to-tr from-teal-400 to-indigo-500 rounded-2xl shadow-lg shadow-teal-500/20 text-slate-950 font-black text-xl">
            🍎
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Portal Nutri Premium</h1>
          <p className="text-xs text-slate-400 mt-1.5">Ingresa tus credenciales para acceder a tu panel de seguimiento.</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs mb-6 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all duration-300 placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all duration-300 placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 text-sm font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition duration-300 shadow-lg shadow-teal-500/15 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Iniciando Sesión...' : 'Entrar al Panel'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
          <p className="text-xs text-slate-400">
            ¿No tienes una cuenta aún?{' '}
            <button
              onClick={() => router.push('/register')}
              className="text-teal-400 hover:text-teal-300 font-semibold underline transition cursor-pointer"
            >
              Regístrate aquí
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
