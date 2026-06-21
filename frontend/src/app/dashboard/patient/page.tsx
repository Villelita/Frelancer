'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Tipado para el progreso histórico
interface HistorialMetrico {
  id: string;
  fecha: string;
  peso: number;
  grasa: number;
  musculo: number;
  agua?: number;
  pliegueAbdominal?: number;
  cambioPeso?: number; // Delta en comparación al anterior
  notas?: string;
}

// Tipado para el plan alimenticio
interface Comida {
  hora: string;
  nombre: string;
  descripcion: string;
  macros: { carbohidratos: number; proteinas: number; grasas: number; kcal: number };
}

interface PlanAlimenticio {
  id: string;
  nombre: string;
  fechaInicio: string;
  caloriasTotales: number;
  distribucionMacros: { carbohidratos: number; proteinas: number; grasas: number };
  comidas: Comida[];
  pdfUrl: string;
}

export default function PatientDashboard() {
  const router = useRouter();
  
  // Estados de sesión
  const [userName, setUserName] = useState<string>('Paciente');
  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [historial, setHistorial] = useState<HistorialMetrico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comidas' | 'analisis'>('comidas');

  // Estado para el modal de simulación de consulta
  const [showSimulateModal, setShowSimulateModal] = useState<boolean>(false);
  const [formPeso, setFormPeso] = useState<string>('62.1');
  const [formGrasa, setFormGrasa] = useState<string>('21.6');
  const [formMusculo, setFormMusculo] = useState<string>('39.0');
  const [formPliegue, setFormPliegue] = useState<string>('12');
  const [formNotas, setFormNotas] = useState<string>('Excelente recomposición muscular detectada.');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 1. Verificar autenticación al montar
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedProfileId = localStorage.getItem('profileId');
    const savedName = localStorage.getItem('userName');

    if (!savedToken || savedRole !== 'USER_PACIENTE' || !savedProfileId) {
      // Redireccionar al login si no tiene sesión activa
      router.push('/login');
    } else {
      setToken(savedToken);
      setPacienteId(savedProfileId);
      setUserName(savedName || 'Paciente');
    }
  }, [router]);

  // 2. Cargar historial cuando el pacienteId esté disponible
  const fetchHistorial = async (profileId: string, userToken: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/consultas/paciente/${profileId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al consultar el historial clínico al servidor.');
      }
      const data = await response.json();
      
      // Mapear y ordenar los datos cronológicamente descendente
      const mappedData: HistorialMetrico[] = data.map((item: any, idx: number, arr: any[]) => {
        let cambioPeso = undefined;
        if (idx < arr.length - 1) {
          cambioPeso = parseFloat((item.peso - arr[idx + 1].peso).toFixed(1));
        }
        
        return {
          id: item.id,
          fecha: new Date(item.fecha).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          peso: item.peso,
          grasa: item.porcentajeGrasa,
          musculo: item.porcentajeMusculo,
          agua: item.porcentajeAgua || undefined,
          pliegueAbdominal: item.pliegueAbdominal || undefined,
          cambioPeso,
          notas: item.notas || undefined
        };
      });

      setHistorial(mappedData);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pacienteId && token) {
      fetchHistorial(pacienteId, token);
    }
  }, [pacienteId, token]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // Registra una nueva consulta simulada
  // NOTA: Como este endpoint requiere rol ADMIN_NUTRIOLOGO, el simulador se logueará
  // temporalmente como el doctor para obtener su token y registrar la consulta, demostrando
  // el flujo completo de autenticación y aislamiento del inquilino (Multi-tenant)
  const handleSubmitConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId || !token) return;

    try {
      setSubmitting(true);

      // A. Autenticarse temporalmente como el doctor sembrado en la base de datos
      const authDoctorRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'alejandro.silva@nutrition.com',
          password: 'password123'
        })
      });

      if (!authDoctorRes.ok) {
        throw new Error('No se pudo autenticar al doctor para realizar la simulación.');
      }

      const doctorData = await authDoctorRes.json();
      const doctorToken = doctorData.accessToken;

      // B. Enviar la consulta con el Token del doctor
      const response = await fetch('http://localhost:3000/api/consultas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${doctorToken}`
        },
        body: JSON.stringify({
          pacienteId: pacienteId,
          peso: parseFloat(formPeso),
          porcentajeGrasa: parseFloat(formGrasa),
          porcentajeMusculo: parseFloat(formMusculo),
          pliegueAbdominal: parseFloat(formPliegue),
          notas: formNotas
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al registrar la consulta.');
      }

      // C. Refrescar el historial clínico usando el token original del paciente
      await fetchHistorial(pacienteId, token);
      setShowSimulateModal(false);
      
      // Auto-actualizar los valores para la siguiente simulación
      setFormPeso((parseFloat(formPeso) - 0.4).toFixed(1));
      setFormGrasa((parseFloat(formGrasa) - 0.3).toFixed(1));
      setFormMusculo((parseFloat(formMusculo) + 0.2).toFixed(1));
      setFormPliegue((parseInt(formPliegue) - 1).toString());
      
      alert('¡Consulta registrada con éxito en Supabase actuando como el Nutriólogo (ADMIN_NUTRIOLOGO)!');
    } catch (err: any) {
      alert(`Error en simulación: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const planActivo: PlanAlimenticio = {
    id: 'plan-premium-1',
    nombre: 'Plan de Recomposición Corporal - Fase Aumento Magro',
    fechaInicio: '10 de Mayo, 2026',
    caloriasTotales: 1850,
    distribucionMacros: { carbohidratos: 45, proteinas: 30, grasas: 25 },
    comidas: [
      {
        hora: '08:00 AM',
        nombre: 'Desayuno: Bowl Proteico de Avena y Berries',
        descripcion: '40g de avena integral cocida en agua, 1 scoop de proteína de suero aislada, 50g de arándanos frescos, 15g de almendras trituradas y canela al gusto.',
        macros: { carbohidratos: 38, proteinas: 32, grasas: 8, kcal: 352 }
      },
      {
        hora: '11:30 AM',
        nombre: 'Snack 1: Manzana Verde con Mantequilla de Maní',
        descripcion: '1 manzana verde mediana cortada en rodajas con 15g (1 cucharada) de mantequilla de maní 100% natural.',
        macros: { carbohidratos: 22, proteinas: 4, grasas: 8, kcal: 176 }
      },
      {
        hora: '02:30 PM',
        nombre: 'Almuerzo: Pechuga a las Hierbas con Quinoa y Espárragos',
        descripcion: '150g de pechuga de pollo a la plancha, 100g de quinoa cocida, 150g de espárragos salteados en 1 cucharadita de aceite de oliva extra virgen.',
        macros: { carbohidratos: 35, proteinas: 38, grasas: 9, kcal: 373 }
      },
      {
        hora: '06:00 PM',
        nombre: 'Snack 2: Shake Post-Entrenamiento',
        descripcion: '1 scoop de proteína WPI en agua, 1 plátano mediano, 5g de creatina monohidratada.',
        macros: { carbohidratos: 27, proteinas: 26, grasas: 1, kcal: 221 }
      },
      {
        hora: '09:00 PM',
        nombre: 'Cena: Filete de Salmón con Puré de Camote y Ensalada Verde',
        descripcion: '130g de salmón al horno, 80g de puré de camote (batata) sin lácteos y ensalada de hojas verdes (espinaca, rúcula) aderezada con limón.',
        macros: { carbohidratos: 25, proteinas: 29, grasas: 14, kcal: 342 }
      }
    ],
    pdfUrl: '/files/plan-valeria-alarcon-recomp.pdf'
  };

  const ultimaMetrica = historial[0] || { peso: 63.3, grasa: 22.9, musculo: 37.9, fecha: 'N/A' };
  const primeraMetrica = historial[historial.length - 1] || { peso: 65.3, grasa: 24.5, musculo: 37.0 };
  const pesoPerdidoTotal = (primeraMetrica.peso - ultimaMetrica.peso).toFixed(1);
  const grasaPerdidaTotal = (primeraMetrica.grasa - ultimaMetrica.grasa).toFixed(1);
  const musculoGanadoTotal = (ultimaMetrica.musculo - primeraMetrica.musculo).toFixed(1);

  if (!pacienteId || !token) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Verificando sesión...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* Fondo decorativo con gradientes */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-950/30 via-teal-950/10 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-80 left-10 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Premium */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-8 border-b border-slate-800/80 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 text-xs font-semibold tracking-wider text-teal-400 bg-teal-400/10 rounded-full border border-teal-500/20 uppercase">
                Paciente Premium
              </span>
              <button
                onClick={() => setShowSimulateModal(true)}
                className="px-3 py-1 text-xs font-bold text-slate-950 bg-teal-300 hover:bg-teal-200 rounded-full transition cursor-pointer active:scale-95 shadow-md shadow-teal-500/10"
              >
                ⚡ Simular Consulta (Nutriólogo)
              </button>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
              Hola, {userName} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Tu seguimiento de composición corporal y plan nutricional en tiempo real.
            </p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-lg shadow-slate-950/50 flex-1 md:flex-initial">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Próxima Consulta</p>
                <p className="text-sm font-medium text-white">{planActivo.fechaInicio}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-2xl transition cursor-pointer active:scale-95 shadow-lg"
              title="Cerrar Sesión"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Carga del Historial */}
        {loading && historial.length === 0 ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Cargando métricas clínicas...</div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-8">
            <p className="font-bold text-sm">⚠️ Error al cargar información</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        ) : null}

        {/* Resumen antropométrico */}
        {!loading && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl transition hover:border-slate-700/80 shadow-md">
              <p className="text-sm font-medium text-slate-400">Peso Corporal Actual</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-extrabold text-white">{ultimaMetrica.peso}</span>
                <span className="text-lg font-semibold text-slate-400">kg</span>
                <span className={`ml-auto flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  parseFloat(pesoPerdidoTotal) >= 0 
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}>
                  {parseFloat(pesoPerdidoTotal) >= 0 ? `↓ ${pesoPerdidoTotal} kg` : `↑ ${Math.abs(parseFloat(pesoPerdidoTotal))} kg`} total
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Última actualización: {ultimaMetrica.fecha}</p>
            </div>

            <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl transition hover:border-slate-700/80 shadow-md">
              <p className="text-sm font-medium text-slate-400">Porcentaje de Grasa</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-extrabold text-white">{ultimaMetrica.grasa}%</span>
                <span className={`ml-auto flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  parseFloat(grasaPerdidaTotal) >= 0 
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}>
                  {parseFloat(grasaPerdidaTotal) >= 0 ? `↓ ${grasaPerdidaTotal}%` : `↑ ${Math.abs(parseFloat(grasaPerdidaTotal))}%`} total
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3.5">
                <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${ultimaMetrica.grasa}%` }} />
              </div>
            </div>

            <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl transition hover:border-slate-700/80 shadow-md">
              <p className="text-sm font-medium text-slate-400">Masa Muscular Esquelética</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-extrabold text-white">{ultimaMetrica.musculo}%</span>
                <span className={`ml-auto flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  parseFloat(musculoGanadoTotal) >= 0 
                    ? 'text-teal-400 bg-teal-500/10 border-teal-500/20' 
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}>
                  {parseFloat(musculoGanadoTotal) >= 0 ? `↑ ${musculoGanadoTotal}%` : `↓ ${Math.abs(parseFloat(musculoGanadoTotal))}%`} total
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3.5">
                <div className="bg-teal-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${ultimaMetrica.musculo}%` }} />
              </div>
            </div>
          </section>
        )}

        {/* Tabs de Selección */}
        <div className="flex border-b border-slate-800 mb-8 gap-4">
          <button
            onClick={() => setActiveTab('comidas')}
            className={`pb-4 text-sm font-semibold tracking-wide transition-all border-b-2 px-1 ${
              activeTab === 'comidas'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 Mi Plan Alimenticio
          </button>
          <button
            onClick={() => setActiveTab('analisis')}
            className={`pb-4 text-sm font-semibold tracking-wide transition-all border-b-2 px-1 ${
              activeTab === 'analisis'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📈 Composición Corporal
          </button>
        </div>

        {/* Contenido Dinámico */}
        {activeTab === 'comidas' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">{planActivo.nombre}</h2>
                    <p className="text-xs text-slate-400 mt-1">Activo desde el {planActivo.fechaInicio}</p>
                  </div>
                  <a
                    href={planActivo.pdfUrl}
                    download
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Simulación de descarga: Su plan alimenticio se guardará en formato PDF.');
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-xl hover:from-teal-300 hover:to-emerald-300 transition duration-300 shadow-md shadow-teal-500/20 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar PDF
                  </a>
                </div>

                <div className="space-y-6">
                  {planActivo.comidas.map((comida, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-indigo-500/30 hover:border-indigo-400 transition-all duration-300">
                      <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 border border-slate-950 shadow" />
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="text-xs font-semibold text-indigo-400 tracking-wide bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                          {comida.hora}
                        </span>
                        <div className="flex gap-3 text-xs text-slate-400">
                          <span>🔥 {comida.macros.kcal} kcal</span>
                          <span>|</span>
                          <span>🥩 {comida.macros.proteinas}g Prot</span>
                          <span>|</span>
                          <span>🥑 {comida.macros.grasas}g Grasa</span>
                          <span>|</span>
                          <span>🍚 {comida.macros.carbohidratos}g Carbs</span>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-white mt-2">{comida.nombre}</h3>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">{comida.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4">Metas Diarias de Energía</h3>
                <div className="text-center py-6 border-b border-slate-800">
                  <span className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
                    {planActivo.caloriasTotales}
                  </span>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Kilocalorías</p>
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-indigo-400">🌾 Carbohidratos (45%)</span>
                      <span className="text-slate-200">208g / día</span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-teal-400">🥩 Proteínas (30%)</span>
                      <span className="text-slate-200">138g / día</span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-2">
                      <div className="bg-teal-400 h-2 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-rose-400">🥑 Grasas (25%)</span>
                      <span className="text-slate-200">51g / día</span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-2">
                      <div className="bg-rose-500 h-2 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-950/20 via-slate-900/30 to-teal-950/20 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-2">Tu Nutriólogo</h3>
                <p className="text-sm text-slate-300 font-semibold">Dr. Alejandro Silva (Nutrición Deportiva)</p>
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs text-slate-400 font-medium">Asesoría activa de plan alimenticio</span>
                </div>
                <button
                  onClick={() => alert('Abriendo chat con el especialista...')}
                  className="w-full mt-5 px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition duration-300 tracking-wide"
                >
                  💬 Enviar Mensaje
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Historial Antropométrico */
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Historial de Mediciones (Live Supabase)</h2>
                <p className="text-xs text-slate-400 mt-1">Evolución antropométrica registrada en consulta clínica por tu especialista.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-4">Fecha</th>
                    <th className="py-4 px-4 text-right">Peso (kg)</th>
                    <th className="py-4 px-4 text-right">Dif. Peso</th>
                    <th className="py-4 px-4 text-right">Grasa (%)</th>
                    <th className="py-4 px-4 text-right">Músculo (%)</th>
                    <th className="py-4 px-4 text-right">Pliegue Abd (mm)</th>
                    <th className="py-4 px-4">Notas Clínicas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {historial.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-800/20 transition-all duration-150">
                      <td className="py-4 px-4 font-medium text-slate-200">{reg.fecha}</td>
                      <td className="py-4 px-4 text-right font-semibold text-white">{reg.peso}</td>
                      <td className="py-4 px-4 text-right">
                        {reg.cambioPeso !== undefined ? (
                          <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                            reg.cambioPeso < 0 
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                              : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                          }`}>
                            {reg.cambioPeso > 0 ? `+${reg.cambioPeso}` : reg.cambioPeso} kg
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right text-indigo-300 font-semibold">{reg.grasa}%</td>
                      <td className="py-4 px-4 text-right text-teal-300 font-semibold">{reg.musculo}%</td>
                      <td className="py-4 px-4 text-right text-slate-400">{reg.pliegueAbdominal || '-'}</td>
                      <td className="py-4 px-4 text-slate-400 max-w-xs truncate" title={reg.notas}>{reg.notas || '-'}</td>
                    </tr>
                  ))}
                  {historial.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No hay consultas registradas en tu historial. Presiona "Simular Consulta" arriba para crear una.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modal interactivo de Simulación de Consulta */}
      {showSimulateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowSimulateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ×
            </button>
            <h3 className="text-lg font-bold text-white mb-2">⚡ Simular Registro de Consulta</h3>
            <p className="text-xs text-slate-400 mb-4">
              Esta sección simula la interfaz del Nutriólogo. El frontend se logueará temporalmente como el doctor (`Dr. Alejandro Silva`) tras bambalinas para subir los datos de composición corporal con autorización a tu Supabase.
            </p>

            <form onSubmit={handleSubmitConsulta} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formPeso}
                    onChange={(e) => setFormPeso(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Pliegue Abd. (mm)</label>
                  <input
                    type="number"
                    required
                    value={formPliegue}
                    onChange={(e) => setFormPliegue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Grasa (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formGrasa}
                    onChange={(e) => setFormGrasa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Músculo (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formMusculo}
                    onChange={(e) => setFormMusculo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notas Clínicas</label>
                <textarea
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white h-20 resize-none focus:outline-none focus:border-teal-500"
                  placeholder="Observaciones de la consulta..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700/80 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition shadow-md shadow-teal-500/10 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Registrar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
