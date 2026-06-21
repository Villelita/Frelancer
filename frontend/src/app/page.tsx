'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function HomePortal() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Fondos decorativos con gradientes difusos HSL */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-teal-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-2xl text-center space-y-6 relative z-10 p-6">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1 text-xs font-semibold tracking-wider text-teal-400 bg-teal-400/10 rounded-full border border-teal-500/20 uppercase mb-4">
          ✨ Experiencia Premium Activa
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
          Portal Clínico de <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400">
            Seguimiento Nutricional
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          Diseñado para superar la experiencia tradicional de seguimiento clínico, combinando análisis antropométrico avanzado y planes de nutrición en tiempo real.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 max-w-sm mx-auto">
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 text-sm font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition duration-300 shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer"
          >
            🔑 Iniciar Sesión
          </button>
          
          <button
            onClick={() => router.push('/register')}
            className="px-8 py-3 text-sm font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition duration-300 active:scale-95 cursor-pointer"
          >
            🌱 Registrarse
          </button>
        </div>

        {/* Footer info */}
        <div className="pt-12 text-slate-500 text-xs tracking-wide">
          Conexión activa con Supabase PostgreSQL y NestJS Backend
        </div>

      </div>
    </div>
  );
}
