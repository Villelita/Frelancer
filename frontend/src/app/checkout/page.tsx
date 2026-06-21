'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  
  // Estados de sesión
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Paciente');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar sesión y estatus actual de pago
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedName = localStorage.getItem('userName');

    if (!savedToken || savedRole !== 'USER_PACIENTE') {
      router.push('/login');
    } else {
      setToken(savedToken);
      setUserName(savedName || 'Paciente');
      checkIfAlreadyPaid(savedToken);
    }
  }, [router]);

  const checkIfAlreadyPaid = async (userToken: string) => {
    try {
      const res = await fetch('http://localhost:3000/api/citas/status', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      if (res.ok) {
        const status = await res.json();
        if (status.paid && status.booked) {
          router.push('/dashboard/patient');
        } else if (status.paid && !status.booked) {
          router.push('/dashboard/patient/book');
        }
      }
    } catch (err) {
      console.error('Error al comprobar estatus de pago:', err);
    }
  };

  const handleStripeCheckout = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Solicitar sesión de Stripe Checkout al backend
      const response = await fetch('http://localhost:3000/api/citas/stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al iniciar sesión de pago.');
      }

      const data = await response.json();
      
      // 2. Redireccionar al cliente a la pasarela segura de Stripe
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió la URL de redirección de Stripe.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la pasarela de pagos.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased relative overflow-hidden flex flex-col justify-between">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-950/20 via-teal-950/5 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-teal-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-teal-400 to-indigo-500 rounded-xl text-slate-950 font-black text-sm">
            🍎
          </div>
          <span className="font-extrabold text-white text-lg tracking-tight">Nutri Portal Premium</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col lg:flex-row gap-12 items-center justify-center">
        
        {/* Left Section: Service Value */}
        <div className="lg:w-1/2 space-y-6">
          <span className="px-2.5 py-1 text-xs font-semibold tracking-wider text-teal-400 bg-teal-400/10 rounded-full border border-teal-500/20 uppercase">
            Suscripción Premium Activa
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Comienza tu Plan Nutricional de Alto Rendimiento
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Hola <span className="text-teal-400 font-bold">{userName}</span>, estás a un paso de abrir tu expediente clínico digital, agendar tu cita inicial de videollamada y descargar tu plan alimenticio estructurado en gramos.
          </p>

          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-teal-500/15 rounded-lg border border-teal-500/30 text-teal-400 text-xs font-bold">✔</div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Expediente Clínico Interactivo</h3>
                <p className="text-xs text-slate-400 mt-0.5">Gráficas SVG automáticas de peso, % de grasa y músculo.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-teal-500/15 rounded-lg border border-teal-500/30 text-teal-400 text-xs font-bold">✔</div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Calculadora de Macros e Historial</h3>
                <p className="text-xs text-slate-400 mt-0.5">Información calórica sincronizada con el portal del especialista.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-teal-500/15 rounded-lg border border-teal-500/30 text-teal-400 text-xs font-bold">✔</div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Videollamada de Valoración</h3>
                <p className="text-xs text-slate-400 mt-0.5">Elige fecha y hora real con tu especialista en segundos.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Premium Checkout Card & Stripe Redirection */}
        <div className="lg:w-1/2 w-full max-w-md">
          
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative space-y-6">
            
            <div className="text-center pb-4 border-b border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Orden de Pago</span>
              <h2 className="text-xl font-bold text-white mt-1">Consulta Nutricional Inicial</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Consulta de Valoración</span>
                <span className="text-slate-200 font-mono">$990.00 MXN</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Acceso a Plataforma</span>
                <span className="text-emerald-400 font-bold">GRATIS</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>IVA Incluido (16%)</span>
                <span className="text-slate-200 font-mono">$136.55 MXN</span>
              </div>
              
              <div className="pt-4 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Total</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 font-mono">
                  $990.00 MXN
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs leading-relaxed">
                {error}
              </div>
            )}

            <div className="space-y-4 pt-4">
              <button
                onClick={handleStripeCheckout}
                disabled={loading}
                className="w-full py-4 text-sm font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition duration-300 shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Conectando con Stripe...</span>
                  </div>
                ) : (
                  <>
                    <span>💳</span>
                    <span>Pagar de Forma Segura con Stripe</span>
                  </>
                )}
              </button>

              <div className="flex justify-center items-center gap-4 text-[10px] text-slate-500 pt-2 font-mono">
                <span>🔒 SSL ENCRYPTED</span>
                <span>•</span>
                <span>🛡 STRIPE COMPLIANT</span>
              </div>
            </div>

            {/* Badges de tarjetas aceptadas */}
            <div className="flex justify-center items-center gap-3 opacity-30 grayscale hover:opacity-50 transition duration-300 pt-2">
              <span className="text-xs font-bold font-mono">VISA</span>
              <span className="text-xs font-bold font-mono">MASTERCARD</span>
              <span className="text-xs font-bold font-mono">AMERICAN EXPRESS</span>
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-600 text-[10px] border-t border-slate-900/60">
        © 2026 Nutri Portal. Pagos procesados a través de las APIs seguras de Stripe Inc.
      </footer>
    </div>
  );
}
