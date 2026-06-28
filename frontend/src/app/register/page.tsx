'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Nutriologo {
  id: string;
  nombre: string;
  especialidades: string[];
}

export default function RegisterPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN_NUTRIOLOGO' | 'USER_PACIENTE'>('USER_PACIENTE');
  const [nutriologoId, setNutriologoId] = useState('');
  const [nutriologos, setNutriologos] = useState<Nutriologo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Cargar lista de nutriólogos si el rol seleccionado es paciente
  useEffect(() => {
    const fetchNutriologos = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/nutriologos');
        if (response.ok) {
          const data = await response.json();
          setNutriologos(data);
          if (data.length > 0) {
            setNutriologoId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error al cargar nutriólogos:', err);
      }
    };

    fetchNutriologos();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: any = {
      nombre,
      email,
      password,
      role
    };

    if (role === 'USER_PACIENTE' && nutriologoId) {
      payload.nutriologoId = nutriologoId;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al registrar usuario.');
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Fondos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Card de Registro Glassmorphism */}
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl shadow-slate-950/80 relative z-10 transition hover:border-slate-700/60 duration-300">
        
        {/* Logo/Icon */}
        <div className="flex justify-center mb-5">
          <div className="p-3 bg-gradient-to-tr from-teal-400 to-indigo-500 rounded-2xl shadow-lg shadow-teal-500/20 text-slate-950 font-black text-xl">
            🌱
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Únete a la Plataforma</h1>
          <p className="text-xs text-slate-400 mt-1.5">Regístrate como paciente para comenzar tu seguimiento nutricional.</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs mb-5 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nombre Completo</label>
            <input
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all duration-300 placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all duration-300 placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Contraseña</label>
            <input
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all duration-300 placeholder:text-slate-600"
            />
          </div>

          {/* El registro público está restringido a pacientes; el rol por defecto es USER_PACIENTE */}
          {nutriologos.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Selecciona tu Nutriólogo</label>
              <select
                value={nutriologoId}
                onChange={(e) => setNutriologoId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
              >
                {nutriologos.map((nutri) => (
                  <option key={nutri.id} value={nutri.id}>
                    {nutri.nombre} ({nutri.especialidades.slice(0, 1).join('')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-3 text-sm font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition duration-300 shadow-lg shadow-teal-500/15 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Creando Cuenta...' : 'Registrar Cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
          <p className="text-xs text-slate-400">
            ¿Ya tienes una cuenta?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-teal-400 hover:text-teal-300 font-semibold underline transition cursor-pointer"
            >
              Inicia sesión
            </button>
          </p>
        </div>

      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-teal-500/30 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <span className="text-5xl block">✨</span>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">¡Registro Exitoso!</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tu cuenta de paciente ha sido creada con éxito en el sistema. Inicia sesión para comenzar tu seguimiento.
              </p>
            </div>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/login');
              }}
              className="w-full py-3 text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition duration-200 shadow cursor-pointer active:scale-95"
            >
              Comenzar a usar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
