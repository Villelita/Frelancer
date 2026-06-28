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
  const [showToast, setShowToast] = useState(false);

  // Estados de la agenda (Copiado de la página de reserva original)
  const [availableDays, setAvailableDays] = useState<{ date: Date; dateStr: string; label: string }[]>([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [modalidad, setModalidad] = useState<'VIRTUAL' | 'PRESENCIAL'>('VIRTUAL');
  const [notas, setNotas] = useState('');

  // Slots de horas disponibles (Lunes a Viernes)
  const timeSlots = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '04:00 PM',
    '05:00 PM',
    '06:00 PM',
    '07:00 PM'
  ];

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
      generateNextBusinessDays();

      // Comprobar si viene de una cancelación
      const params = new URLSearchParams(window.location.search);
      if (params.get('canceled') === 'true') {
        setShowToast(true);
        const timer = setTimeout(() => setShowToast(false), 4000);
        return () => clearTimeout(timer);
      }
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

  // Genera los siguientes 8 días hábiles (excluyendo fines de semana)
  const generateNextBusinessDays = () => {
    const daysList = [];
    let current = new Date();
    
    // Sumamos 1 día para no agendar hoy de golpe si es tarde
    current.setDate(current.getDate() + 1);

    while (daysList.length < 8) {
      const dayOfWeek = current.getDay();
      // 0 = Domingo, 6 = Sábado
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysList.push({
          date: new Date(current),
          dateStr: current.toISOString().split('T')[0],
          label: current.toLocaleDateString('es-MX', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          })
        });
      }
      current.setDate(current.getDate() + 1);
    }
    setAvailableDays(daysList);
    setSelectedDayIdx(0); // Seleccionar el primer día por defecto
  };

  const handleStripeCheckout = async () => {
    if (!token || selectedDayIdx === null || !selectedTimeSlot) return;
    setLoading(true);
    setError(null);

    try {
      // Combinar fecha y hora para enviar en el formato correcto
      const day = availableDays[selectedDayIdx];
      const timeParts = selectedTimeSlot.split(' ');
      const hourMin = timeParts[0].split(':');
      let hour = parseInt(hourMin[0]);
      const minute = parseInt(hourMin[1]);
      
      if (timeParts[1] === 'PM' && hour !== 12) {
        hour += 12;
      } else if (timeParts[1] === 'AM' && hour === 12) {
        hour = 0;
      }

      const fechaHora = new Date(day.date);
      fechaHora.setHours(hour, minute, 0, 0);

      // 1. Solicitar sesión de Stripe Checkout al backend enviando la reserva seleccionada
      const response = await fetch('http://localhost:3000/api/citas/stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fechaHora: fechaHora.toISOString(),
          modalidad,
          notas
        })
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
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col lg:flex-row gap-8 items-start justify-center">
        
        {/* Left Section: Service Value & Calendar Scheduler */}
        <div className="lg:w-7/12 w-full space-y-6">
          <div className="space-y-2">
            <span className="px-2.5 py-1 text-xs font-semibold tracking-wider text-teal-400 bg-teal-400/10 rounded-full border border-teal-500/20 uppercase">
              Paso 1: Elige tu Cita
            </span>
            <h1 className="text-3xl font-black text-white leading-tight">
              Selecciona tu Fecha y Hora de Valoración
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              Hola <span className="text-teal-400 font-bold">{userName}</span>, selecciona tu horario ideal en la cuadrícula de abajo antes de proceder al pago seguro. Una vez liquidada tu orden de consulta, tu acceso a la plataforma nutricional completa será liberado al instante.
            </p>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-900">
            {/* Step 1: Seleccionar Día */}
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-3">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider text-indigo-400">1. Selecciona el Día</h2>
              
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
                {availableDays.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedDayIdx(idx);
                      setSelectedTimeSlot(null); // Resetear hora al cambiar de día
                    }}
                    className={`flex-shrink-0 p-3 rounded-xl border flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer active:scale-95 min-w-[85px] ${
                      selectedDayIdx === idx
                        ? 'bg-teal-500/10 border-teal-500/50 text-white font-bold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 uppercase font-mono">{day.label.split(' ')[0]}</span>
                    <span className="text-sm font-bold">{day.label.split(' ')[1]}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{day.label.split(' ')[2]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Seleccionar Horario */}
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-3">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider text-indigo-400">2. Selecciona la Hora</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {timeSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`py-3 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 font-mono text-xs ${
                      selectedTimeSlot === slot
                        ? 'bg-teal-500/10 border-teal-500/50 text-white font-bold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Seleccionar Modalidad */}
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-3">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider text-indigo-400">3. Selecciona la Modalidad</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setModalidad('VIRTUAL')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all duration-200 cursor-pointer active:scale-95 text-left ${
                    modalidad === 'VIRTUAL'
                      ? 'bg-teal-500/10 border-teal-500/50 text-white shadow-md shadow-teal-500/5'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700/60 hover:text-slate-200'
                  }`}
                >
                  <span className="text-2xl">💻</span>
                  <div>
                    <span className="block text-xs font-bold text-white">Videollamada Virtual</span>
                    <span className="block text-[9px] text-slate-500 mt-0.5">A través del portal de Nutri Portal</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setModalidad('PRESENCIAL')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all duration-200 cursor-pointer active:scale-95 text-left ${
                    modalidad === 'PRESENCIAL'
                      ? 'bg-teal-500/10 border-teal-500/50 text-white shadow-md shadow-teal-500/5'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700/60 hover:text-slate-200'
                  }`}
                >
                  <span className="text-2xl">🏥</span>
                  <div>
                    <span className="block text-xs font-bold text-white">Presencial (Consultorio)</span>
                    <span className="block text-[9px] text-slate-500 mt-0.5">Av. Vasconcelos 402, Consultorio 3B</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Notes Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400">Objetivos / Notas para el doctor (Opcional)</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-xs text-white h-20 resize-none focus:outline-none placeholder:text-slate-700"
                placeholder="Describe si tienes alergias, metas de peso o alguna condición médica..."
              />
            </div>

          </div>
        </div>

        {/* Right Section: Premium Checkout Card & Stripe Redirection */}
        <div className="lg:w-5/12 w-full max-w-md lg:sticky lg:top-8">
          
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6">
            
            <div className="text-center pb-4 border-b border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Orden de Pago</span>
              <h2 className="text-lg font-bold text-white mt-1">Consulta Nutricional Inicial</h2>
            </div>

            {/* Detalle de cita seleccionada en la tarjeta */}
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Cita de Valoración Elegida</div>
              
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">📅</span>
                <span className="font-bold">
                  {selectedDayIdx !== null && availableDays[selectedDayIdx]
                    ? availableDays[selectedDayIdx].label
                    : 'Selecciona fecha en la izquierda'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span className="p-1.5 bg-teal-500/10 rounded-lg text-teal-400">⏰</span>
                <span className="font-bold font-mono">
                  {selectedTimeSlot || 'Selecciona horario en la izquierda'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                  {modalidad === 'VIRTUAL' ? '💻' : '🏥'}
                </span>
                <span className="font-bold">
                  {modalidad === 'VIRTUAL' ? 'Videollamada Virtual' : 'Presencial (Consultorio)'}
                </span>
              </div>
            </div>

            {/* Precios */}
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
              
              <div className="pt-4 border-t border-slate-800/80 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Total</span>
                <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 font-mono">
                  $990.00 MXN
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs leading-relaxed">
                {error}
              </div>
            )}

            <div className="space-y-4 pt-2">
              <button
                onClick={handleStripeCheckout}
                disabled={loading || selectedDayIdx === null || !selectedTimeSlot}
                className="w-full py-4 text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition duration-300 shadow-lg shadow-teal-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Conectando con Stripe...'
                ) : selectedDayIdx === null || !selectedTimeSlot ? (
                  '⚠️ Elige tu Horario para Continuar'
                ) : (
                  <>
                    <span>💳</span>
                    <span>Pagar y Confirmar Cita</span>
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

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold">
            ✓
          </span>
          <div className="text-left min-w-[200px]">
            <span className="block text-xs font-bold text-white">Cita cancelada con éxito</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">El horario ha sido liberado en el sistema</span>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="text-slate-500 hover:text-white text-sm ml-2 cursor-pointer font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
