'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BookAppointmentPage() {
  const router = useRouter();
  
  // Estados de sesión
  const [token, setToken] = useState<string | null>(null);
  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Paciente');

  // Estados de fechas y agenda
  const [availableDays, setAvailableDays] = useState<{ date: Date; dateStr: string; label: string }[]>([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [notas, setNotas] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // 1. Validar autenticación y estado de pago
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedProfileId = localStorage.getItem('profileId');
    const savedName = localStorage.getItem('userName');

    if (!savedToken || savedRole !== 'USER_PACIENTE' || !savedProfileId) {
      router.push('/login');
    } else {
      setToken(savedToken);
      setPacienteId(savedProfileId);
      setUserName(savedName || 'Paciente');
      verifyPaymentStatus(savedToken);
      generateNextBusinessDays();
    }
  }, [router]);

  const verifyPaymentStatus = async (userToken: string) => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/citas/status', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      if (res.ok) {
        const status = await res.json();
        if (!status.paid) {
          // No ha pagado, forzar redirección
          router.push('/checkout');
        } else if (status.booked) {
          // Ya tiene cita agendada, mandarlo directamente al dashboard
          router.push('/dashboard/patient');
        }
      } else {
        router.push('/checkout');
      }
    } catch (err) {
      console.error(err);
      setError('Error de red al comprobar estatus de pago.');
    } finally {
      setLoading(false);
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

  const handleConfirmReservation = async () => {
    if (selectedDayIdx === null || !selectedTimeSlot || !token) {
      alert('Por favor selecciona una fecha y horario para continuar.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

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

      const response = await fetch('http://localhost:3000/api/citas/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fechaHora: fechaHora.toISOString(),
          notas
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al agendar la cita.');
      }

      alert('¡Cita agendada con éxito! Acceso al expediente clínico liberado.');
      router.push('/dashboard/patient');
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la pasarela de citas.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Verificando estatus de pago...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased relative overflow-hidden flex flex-col justify-between">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-950/20 via-teal-950/5 to-transparent pointer-events-none -z-10" />

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

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col justify-center">
        
        <div className="space-y-4 mb-8 text-center lg:text-left">
          <span className="px-2.5 py-1 text-xs font-semibold tracking-wider text-teal-400 bg-teal-400/10 rounded-full border border-teal-500/20 uppercase">
            Pago Verificado ✔
          </span>
          <h1 className="text-3xl font-extrabold text-white">Programa tu Cita Inicial</h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Elige la fecha y el horario que mejor te convenga para tu primera consulta virtual de antropometría y estructuración de plan alimenticio.
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs mb-6 leading-relaxed max-w-2xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Col 1 & 2: Calendar & Slots Selection */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Step 1: Seleccionar Día */}
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-indigo-400">1. Selecciona el Día</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availableDays.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDayIdx(idx);
                      setSelectedTimeSlot(null); // Reset hora al cambiar de día
                    }}
                    className={`py-3.5 px-2.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                      selectedDayIdx === idx
                        ? 'bg-teal-500/10 border-teal-500/50 text-white shadow-md shadow-teal-500/5'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase">{d.label.split(' ')[0]}</span>
                    <span className="text-xl font-bold mt-1 text-white">{d.label.split(' ')[1]}</span>
                    <span className="text-[10px] text-slate-500 uppercase mt-0.5">{d.label.split(' ')[2]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Seleccionar Horario */}
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-indigo-400">2. Selecciona la Hora</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {timeSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`py-3 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 font-mono text-sm ${
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

          </div>

          {/* Col 3: Resume and submit */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between h-full">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-indigo-400">Resumen de Cita</h3>
                
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                  <div className="text-xs text-slate-400">
                    <span className="block font-semibold">Paciente:</span>
                    <span className="text-slate-200 text-sm mt-0.5 block font-bold">{userName}</span>
                  </div>

                  <div className="text-xs text-slate-400">
                    <span className="block font-semibold">Fecha Seleccionada:</span>
                    <span className="text-slate-200 text-sm mt-0.5 block font-bold">
                      {selectedDayIdx !== null ? availableDays[selectedDayIdx].label : 'Pendiente...'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">
                    <span className="block font-semibold">Hora de Cita:</span>
                    <span className="text-slate-200 text-sm mt-0.5 block font-bold font-mono">
                      {selectedTimeSlot || 'Pendiente...'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">
                    <span className="block font-semibold">Modalidad:</span>
                    <span className="text-teal-400 text-sm mt-0.5 block font-bold">Videollamada Virtual</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Objetivos / Notas para el doctor (Opcional)</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-xs text-white h-24 resize-none focus:outline-none placeholder:text-slate-700"
                    placeholder="Describe si tienes alergias, metas de peso o alguna condición médica..."
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleConfirmReservation}
                  disabled={submitting || selectedDayIdx === null || !selectedTimeSlot}
                  className="w-full py-3.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition duration-300 shadow-md shadow-teal-500/10 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {submitting ? 'Confirmando Reserva...' : '📅 Confirmar Reserva'}
                </button>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-600 text-[10px] border-t border-slate-900">
        Nutri Portal Citas. Puedes reagendar tu cita hasta 24 horas antes sin costo adicional.
      </footer>
    </div>
  );
}
