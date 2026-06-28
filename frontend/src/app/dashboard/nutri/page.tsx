'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationModal from '../../../components/NotificationModal';

interface Paciente {
  id: string;
  nombre: string;
  fechaNacimiento: string;
  telefono: string;
  genero: string;
  user: { email: string };
}

export default function NutriDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [nutriName, setNutriName] = useState<string>('Nutriólogo');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');

  // Estados para Modal de Notificaciones
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalOpen(true);
  };
  
  // Estado de simulación de planes (Starter, Pro, Enterprise)
  const [mockupPlan, setMockupPlan] = useState<'STARTER' | 'PRO' | 'ENTERPRISE'>('ENTERPRISE');

  // Estados de carga y error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estados del Formulario de Consulta (Expediente) ---
  const [peso, setPeso] = useState('70.0');
  const [grasa, setGrasa] = useState('20.0');
  const [musculo, setMusculo] = useState('38.0');
  const [agua, setAgua] = useState('55.0');
  const [pliegueTricipital, setPliegueTricipital] = useState('12');
  const [pliegueSubescapular, setPliegueSubescapular] = useState('14');
  const [pliegueSuprailiaco, setPliegueSuprailiaco] = useState('16');
  const [pliegueAbdominal, setPliegueAbdominal] = useState('18');
  const [notas, setNotas] = useState('');
  const [submittingConsulta, setSubmittingConsulta] = useState(false);

  // --- Estados de la Calculadora de Macros (Mifflin-St Jeor) ---
  const [calcPeso, setCalcPeso] = useState(70);
  const [calcEstatura, setCalcEstatura] = useState(170); // en cm
  const [calcEdad, setCalcEdad] = useState(30);
  const [calcGenero, setCalcGenero] = useState<'male' | 'female'>('female');
  const [calcActividad, setCalcActividad] = useState(1.375); // Ligero
  const [calcObjetivo, setCalcObjetivo] = useState(1); // 1: Mantenimiento, 0.85: Deficit, 1.1: Volumen
  
  const [protGk, setProtGk] = useState(2.0); // g/kg de peso
  const [grasaGk, setGrasaGk] = useState(0.8); // g/kg de peso

  // Resultados de cálculo
  const [bmr, setBmr] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [caloriasObjetivo, setCaloriasObjetivo] = useState(0);
  const [macros, setMacros] = useState({
    carbohidratos: { g: 0, kcal: 0, pct: 0 },
    proteinas: { g: 0, kcal: 0, pct: 0 },
    grasas: { g: 0, kcal: 0, pct: 0 }
  });

  // --- Estados del Generador de Planes Alimenticios (Enterprise) ---
  const [planNombre, setPlanNombre] = useState('Plan de Recomposición Corporal - Fase Aumento Magro');
  const [planKcal, setPlanKcal] = useState(1850);
  const [planCarbPct, setPlanCarbPct] = useState(45);
  const [planProtPct, setPlanProtPct] = useState(30);
  const [planGrasaPct, setPlanGrasaPct] = useState(25);
  const [desayuno, setDesayuno] = useState('40g de avena integral cocida en agua, 1 scoop de proteína de suero aislada, 50g de arándanos frescos, 15g de almendras trituradas y canela al gusto.');
  const [colacion1, setColacion1] = useState('1 manzana verde mediana cortada en rodajas con 15g (1 cucharada) de mantequilla de maní 100% natural.');
  const [comida, setComida] = useState('150g de pechuga de pollo a la plancha, 100g de quinoa cocida, 150g de espárragos salteados en 1 cucharadita de aceite de oliva extra virgen.');
  const [colacion2, setColacion2] = useState('1 scoop de proteína WPI en agua, 1 plátano mediano, 5g de creatina monohidratada.');
  const [cena, setCena] = useState('130g de salmón al horno, 80g de puré de camote (batata) sin lácteos y ensalada de hojas verdes (espinaca, rúcula) aderezada con limón.');
  const [submittingPlan, setSubmittingPlan] = useState(false);

  // 1. Validar autenticación
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedName = localStorage.getItem('userName');

    if (!savedToken || savedRole !== 'ADMIN_NUTRIOLOGO') {
      router.push('/login');
    } else {
      setToken(savedToken);
      setNutriName(savedName || 'Nutriólogo');
      fetchPacientes(savedToken);
    }
  }, [router]);

  // 2. Cargar pacientes
  const fetchPacientes = async (savedToken: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/auth/pacientes', {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Error al cargar la lista de pacientes.');
      }
      const data = await response.json();
      setPacientes(data);
      if (data.length > 0) {
        setSelectedPacienteId(data[0].id);
        setCalcPeso(63); // Paciente de prueba default
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Ejecutar calculadora de macros
  useEffect(() => {
    // Fórmula de Mifflin-St Jeor
    let metabBasal = 0;
    if (calcGenero === 'male') {
      metabBasal = 10 * calcPeso + 6.25 * calcEstatura - 5 * calcEdad + 5;
    } else {
      metabBasal = 10 * calcPeso + 6.25 * calcEstatura - 5 * calcEdad - 161;
    }

    const gastoTotal = metabBasal * calcActividad;
    const objetivoKcal = Math.round(gastoTotal * calcObjetivo);

    // Reparto en gramos y kcal
    const gProteinas = Math.round(calcPeso * protGk);
    const kcalProteinas = gProteinas * 4;

    const gGrasas = Math.round(calcPeso * grasaGk);
    const kcalGrasas = gGrasas * 9;

    const kcalRestantes = objetivoKcal - (kcalProteinas + kcalGrasas);
    const gCarbohidratos = Math.max(0, Math.round(kcalRestantes / 4));
    const kcalCarbohidratos = gCarbohidratos * 4;

    // Calcular porcentajes
    const totalKcalCalculadas = kcalProteinas + kcalGrasas + kcalCarbohidratos;
    const pctProt = Math.round((kcalProteinas / totalKcalCalculadas) * 100) || 0;
    const pctGrasa = Math.round((kcalGrasas / totalKcalCalculadas) * 100) || 0;
    const pctCarb = 100 - (pctProt + pctGrasa);

    setBmr(Math.round(metabBasal));
    setTdee(Math.round(gastoTotal));
    setCaloriasObjetivo(objetivoKcal);
    setMacros({
      carbohidratos: { g: gCarbohidratos, kcal: kcalCarbohidratos, pct: pctCarb },
      proteinas: { g: gProteinas, kcal: kcalProteinas, pct: pctProt },
      grasas: { g: gGrasas, kcal: kcalGrasas, pct: pctGrasa }
    });
  }, [calcPeso, calcEstatura, calcEdad, calcGenero, calcActividad, calcObjetivo, protGk, grasaGk]);

  // 4. Guardar Consulta (Expediente)
  const handleSaveConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPacienteId || !token) {
      showNotification('Atención', 'Por favor selecciona un paciente válido.', 'warning');
      return;
    }

    try {
      setSubmittingConsulta(true);
      const response = await fetch('http://localhost:3000/api/consultas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pacienteId: selectedPacienteId,
          peso: parseFloat(peso),
          porcentajeGrasa: parseFloat(grasa),
          porcentajeMusculo: parseFloat(musculo),
          porcentajeAgua: parseFloat(agua),
          pliegueTricipital: parseFloat(pliegueTricipital),
          pliegueSubescapular: parseFloat(pliegueSubescapular),
          pliegueSuprailiaco: parseFloat(pliegueSuprailiaco),
          pliegueAbdominal: parseFloat(pliegueAbdominal),
          notas
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al guardar la consulta.');
      }

      showNotification('Actualización Exitosa', '¡Expediente actualizado con éxito! Mediciones registradas en Supabase.', 'success');
      setNotas('');
    } catch (err: any) {
      showNotification('Error', err.message || 'Error al guardar la consulta.', 'error');
    } finally {
      setSubmittingConsulta(false);
    }
  };

  // 5. Guardar Plan Alimenticio (Enterprise exclusive)
  const handleSavePlanAlimenticio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPacienteId || !token) {
      showNotification('Atención', 'Por favor selecciona un paciente válido.', 'warning');
      return;
    }

    try {
      setSubmittingPlan(true);
      const response = await fetch('http://localhost:3000/api/planes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pacienteId: selectedPacienteId,
          nombre: planNombre,
          contenidoJson: {
            caloriasTotales: planKcal,
            distribucionMacros: {
              carbohidratos: planCarbPct,
              proteinas: planProtPct,
              grasas: planGrasaPct,
            },
            comidas: [
              { hora: '08:00 AM', nombre: 'Desayuno: Bowl Proteico de Avena y Berries', descripcion: desayuno, macros: { carbohidratos: 38, proteinas: 32, grasas: 8, kcal: 352 } },
              { hora: '11:30 AM', nombre: 'Snack 1: Manzana Verde con Mantequilla de Maní', descripcion: colacion1, macros: { carbohidratos: 22, proteinas: 4, grasas: 8, kcal: 176 } },
              { hora: '02:30 PM', nombre: 'Almuerzo: Pechuga a las Hierbas con Quinoa y Espárragos', descripcion: comida, macros: { carbohidratos: 35, proteinas: 38, grasas: 9, kcal: 373 } },
              { hora: '06:00 PM', nombre: 'Snack 2: Shake Post-Entrenamiento', descripcion: colacion2, macros: { carbohidratos: 27, proteinas: 26, grasas: 1, kcal: 221 } },
              { hora: '09:00 PM', nombre: 'Cena: Filete de Salmón con Puré de Camote y Ensalada Verde', descripcion: cena, macros: { carbohidratos: 25, proteinas: 29, grasas: 14, kcal: 342 } },
            ]
          },
          fechaInicio: new Date().toISOString(),
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al guardar el plan alimenticio.');
      }

      showNotification('Plan Asignado', '¡Plan Alimenticio asignado y compartido con éxito con el paciente!', 'success');
    } catch (err: any) {
      showNotification('Error', err.message || 'Error al guardar el plan alimenticio.', 'error');
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased relative overflow-hidden">
      {/* Fondos degradados decorativos */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-950/20 via-teal-950/5 to-transparent pointer-events-none -z-10" />

      {/* Main container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <header className="flex justify-between items-center pb-6 border-b border-slate-800/80 mb-8">
          <div>
            <span className="px-2.5 py-1 text-xs font-semibold tracking-wider text-teal-400 bg-teal-400/10 rounded-full border border-teal-500/20 uppercase">
              Panel del Especialista
            </span>
            <h1 className="text-2xl font-black text-white mt-1">Dr. {nutriName}</h1>
          </div>
          
          <button
            onClick={handleLogout}
            className="p-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-2xl transition cursor-pointer active:scale-95 shadow"
            title="Cerrar Sesión"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </header>

        {/* Mockup Plan Switcher Bar */}
        <div className="mb-8 p-5 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div>
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>⚡</span> Simulador Multitenant (Demostración de Planes de la Propuesta)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Permite alternar entre los 3 planes comerciales (Starter, Pro, Enterprise) para previsualizar los privilegios y herramientas disponibles.</p>
          </div>
          <div className="flex gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setMockupPlan('STARTER')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                mockupPlan === 'STARTER'
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300 shadow-md'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              🥉 Starter
            </button>
            <button
              onClick={() => setMockupPlan('PRO')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                mockupPlan === 'PRO'
                  ? 'bg-slate-400/20 border border-slate-400/30 text-slate-200 shadow-md'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              🥈 Pro
            </button>
            <button
              onClick={() => setMockupPlan('ENTERPRISE')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                mockupPlan === 'ENTERPRISE'
                  ? 'bg-teal-500/20 border border-teal-500/30 text-teal-300 shadow-md'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              🥇 Enterprise
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Listado de Pacientes (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">👥 Pacientes Activos</h2>
                <span className="text-[10px] text-slate-500 font-mono">Multitenant Aislamiento</span>
              </div>
              
              {loading ? (
                <div className="text-center py-6 text-slate-500">Cargando pacientes...</div>
              ) : error ? (
                <div className="text-rose-400 text-xs py-2">{error}</div>
              ) : (
                <div className="space-y-3">
                  {pacientes.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPacienteId(p.id);
                        if (p.nombre.includes('Valeria')) {
                          setCalcPeso(63);
                        }
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        selectedPacienteId === p.id
                          ? 'bg-teal-500/10 border-teal-500/40 text-white'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:text-slate-200'
                      }`}
                    >
                      <p className="font-semibold text-sm">{p.nombre}</p>
                      <p className="text-xs text-slate-500 mt-1">{p.user.email} | {p.genero || 'No especificado'}</p>
                    </button>
                  ))}
                  {pacientes.length === 0 && (
                    <p className="text-xs text-slate-500 py-4 text-center">No hay pacientes registrados bajo tu tutela.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Columna Central y Derecha: Resto del Dashboard (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* --- PLAN STARTER VIEW (LOCK SCREEN) --- */}
            {mockupPlan === 'STARTER' && (
              <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 p-10 rounded-3xl text-center space-y-5 shadow-2xl">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 text-3xl">
                  🔒
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white">Módulos Bloqueados en Plan Starter</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    El Plan Starter de <strong>$18,000 MXN</strong> incluye Landing Page y Agenda automatizada. Para desbloquear el Expediente Clínico Digital, Mediciones de composición corporal y Calculadoras nutricionales, solicita el <strong>Plan Pro</strong>.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setMockupPlan('PRO')}
                    className="px-6 py-3 text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition cursor-pointer active:scale-95 shadow-lg shadow-teal-500/10"
                  >
                    🚀 Simular Actualización a Plan Pro
                  </button>
                </div>
              </div>
            )}

            {/* --- PRO & ENTERPRISE COMPONENT BLOCK --- */}
            {mockupPlan !== 'STARTER' && (
              <>
                {/* Expediente Clínico Digital */}
                <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
                  <h2 className="text-lg font-bold text-white mb-2">📝 Registrar Nueva Consulta (Expediente Clínico)</h2>
                  <p className="text-xs text-slate-400 mb-6">Inserta las mediciones de composición corporal y pliegues para actualizar el historial del paciente seleccionado.</p>
                  
                  <form onSubmit={handleSaveConsulta} className="space-y-4">
                    
                    {/* Antropometría General */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Peso (kg)</label>
                        <input
                          type="number" step="0.1" required value={peso} onChange={(e) => setPeso(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Grasa (%)</label>
                        <input
                          type="number" step="0.1" required value={grasa} onChange={(e) => setGrasa(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Masa Músculo (%)</label>
                        <input
                          type="number" step="0.1" required value={musculo} onChange={(e) => setMusculo(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Agua Corporal (%)</label>
                        <input
                          type="number" step="0.1" value={agua} onChange={(e) => setAgua(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Pliegues Cutáneos */}
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 pt-2">Pliegues Cutáneos (mm)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Tricipital</label>
                        <input
                          type="number" value={pliegueTricipital} onChange={(e) => setPliegueTricipital(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Subescapular</label>
                        <input
                          type="number" value={pliegueSubescapular} onChange={(e) => setPliegueSubescapular(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Suprailiaco</label>
                        <input
                          type="number" value={pliegueSuprailiaco} onChange={(e) => setPliegueSuprailiaco(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Abdominal</label>
                        <input
                          type="number" value={pliegueAbdominal} onChange={(e) => setPliegueAbdominal(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Notas Clínicas / Indicaciones del Plan</label>
                      <textarea
                        value={notas} onChange={(e) => setNotas(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-sm text-white h-24 resize-none focus:outline-none"
                        placeholder="Escribe aquí observaciones físicas o indicaciones del plan..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingConsulta}
                        className="px-6 py-2.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition duration-300 shadow-md shadow-teal-500/15 cursor-pointer disabled:opacity-50"
                      >
                        {submittingConsulta ? 'Registrando...' : '💾 Registrar Consulta en Expediente'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Calculadora de Macros Mifflin-St Jeor */}
                <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
                  <h2 className="text-lg font-bold text-white mb-2">🧮 Calculadora de Macros (Mifflin-St Jeor)</h2>
                  <p className="text-xs text-slate-400 mb-6">Calcula la tasa metabólica del paciente y define la repartición de macronutrientes para el plan de comidas.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Inputs */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Peso (kg)</label>
                          <input
                            type="number" value={calcPeso} onChange={(e) => setCalcPeso(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Estatura (cm)</label>
                          <input
                            type="number" value={calcEstatura} onChange={(e) => setCalcEstatura(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Edad (años)</label>
                          <input
                            type="number" value={calcEdad} onChange={(e) => setCalcEdad(parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Género</label>
                          <select
                            value={calcGenero} onChange={(e) => setCalcGenero(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-sm text-white focus:outline-none"
                          >
                            <option value="female">Femenino 👩</option>
                            <option value="male">Masculino 👨</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Nivel de Actividad</label>
                        <select
                          value={calcActividad} onChange={(e) => setCalcActividad(parseFloat(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-sm text-white focus:outline-none"
                        >
                          <option value={1.2}>Sedentario (x1.2)</option>
                          <option value={1.375}>Actividad Ligera (x1.375)</option>
                          <option value={1.55}>Actividad Moderada (x1.55)</option>
                          <option value={1.725}>Actividad Intensa (x1.725)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Proteína (g/kg)</label>
                          <input
                            type="number" step="0.1" value={protGk} onChange={(e) => setProtGk(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Grasa (g/kg)</label>
                          <input
                            type="number" step="0.1" value={grasaGk} onChange={(e) => setGrasaGk(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Objetivo Calórico</label>
                        <select
                          value={calcObjetivo} onChange={(e) => setCalcObjetivo(parseFloat(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-sm text-white focus:outline-none"
                        >
                          <option value={1.0}>Mantenimiento Energético</option>
                          <option value={0.85}>Déficit Calórico (-15%)</option>
                          <option value={1.1}>Superávit Calórico (+10%)</option>
                        </select>
                      </div>
                    </div>

                    {/* Resultados */}
                    <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Resultados de Energía</h3>
                        
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Basal (BMR):</span>
                          <span className="font-semibold text-slate-200">{bmr} kcal</span>
                        </div>

                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Gasto Diario (TDEE):</span>
                          <span className="font-semibold text-slate-200">{tdee} kcal</span>
                        </div>

                        <div className="flex justify-between text-sm font-bold text-teal-400 border-t border-slate-800/80 pt-2">
                          <span>Meta Diaria:</span>
                          <span>{caloriasObjetivo} kcal</span>
                        </div>
                      </div>

                      {/* Distribución macros */}
                      <div className="space-y-3 pt-6 border-t border-slate-800/80 mt-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reparto de Macronutrientes</h4>
                        
                        {/* Proteína */}
                        <div>
                          <div className="flex justify-between text-xs">
                            <span className="text-teal-400 font-semibold">🥩 Proteínas ({macros.proteinas.pct}%)</span>
                            <span className="text-slate-200">{macros.proteinas.g}g ({macros.proteinas.kcal} kcal)</span>
                          </div>
                        </div>

                        {/* Grasa */}
                        <div>
                          <div className="flex justify-between text-xs">
                            <span className="text-rose-400 font-semibold">🥑 Grasas ({macros.grasas.pct}%)</span>
                            <span className="text-slate-200">{macros.grasas.g}g ({macros.grasas.kcal} kcal)</span>
                          </div>
                        </div>

                        {/* Carbos */}
                        <div>
                          <div className="flex justify-between text-xs">
                            <span className="text-indigo-400 font-semibold">🌾 Carbohidratos ({macros.carbohidratos.pct}%)</span>
                            <span className="text-slate-200">{macros.carbohidratos.g}g ({macros.carbohidratos.kcal} kcal)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* --- PLAN PRO EXCLUSIVE LOCK FOR MEAL PLAN GENERATOR --- */}
                {mockupPlan === 'PRO' && (
                  <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 p-8 rounded-3xl text-center space-y-4 shadow-xl">
                    <span className="text-3xl">🔒</span>
                    <h3 className="text-base font-bold text-white">Generador de Dietas Exclusivo de Plan Enterprise</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      El Creador de Planes Alimenticios dinámicos y envío directo a portales privados de pacientes está disponible en el <strong>Plan Enterprise</strong>.
                    </p>
                    <button
                      onClick={() => setMockupPlan('ENTERPRISE')}
                      className="px-4 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition cursor-pointer active:scale-95 shadow"
                    >
                      🚀 Simular Actualización a Plan Enterprise
                    </button>
                  </div>
                )}

                {/* --- ENTERPRISE EXCLUSIVE MEAL PLAN GENERATOR --- */}
                {mockupPlan === 'ENTERPRISE' && (
                  <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-lg font-bold text-white">🍳 Generador de Planes Alimenticios (Enterprise)</h2>
                      <span className="px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-400 bg-emerald-400/10 rounded-full border border-emerald-500/20 uppercase font-mono">
                        Plan Activo
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-6">Genera un menú semanal estructurado y compártelo instantáneamente con el portal privado del paciente.</p>
                    
                    <form onSubmit={handleSavePlanAlimenticio} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre del Plan</label>
                          <input
                            type="text" required value={planNombre} onChange={(e) => setPlanNombre(e.target.value)}
                            placeholder="Ej. Plan Hipo-calórico Definición"
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Calorías Totales (kcal)</label>
                          <input
                            type="number" required value={planKcal} onChange={(e) => setPlanKcal(parseInt(e.target.value) || 0)}
                            placeholder="Ej. 1850"
                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Carbos (%)</label>
                          <input
                            type="number" required value={planCarbPct} onChange={(e) => setPlanCarbPct(parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-950/85 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Proteínas (%)</label>
                          <input
                            type="number" required value={planProtPct} onChange={(e) => setPlanProtPct(parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-950/85 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Grasas (%)</label>
                          <input
                            type="number" required value={planGrasaPct} onChange={(e) => setPlanGrasaPct(parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-950/85 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Comidas del Plan */}
                      <div className="space-y-3 pt-2">
                        <h3 className="text-xs font-bold text-white border-b border-slate-800 pb-1">Distribución del Menú</h3>
                        
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">🍳 Desayuno</label>
                            <input
                              type="text" value={desayuno} onChange={(e) => setDesayuno(e.target.value)}
                              placeholder="Desayuno..."
                              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">🍎 Colación 1</label>
                            <input
                              type="text" value={colacion1} onChange={(e) => setColacion1(e.target.value)}
                              placeholder="Colación 1..."
                              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">🥩 Comida</label>
                            <input
                              type="text" value={comida} onChange={(e) => setComida(e.target.value)}
                              placeholder="Comida..."
                              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">🥛 Colación 2</label>
                            <input
                              type="text" value={colacion2} onChange={(e) => setColacion2(e.target.value)}
                              placeholder="Colación 2..."
                              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">🐟 Cena</label>
                            <input
                              type="text" value={cena} onChange={(e) => setCena(e.target.value)}
                              placeholder="Cena..."
                              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={submittingPlan || !selectedPacienteId}
                          className="px-6 py-2.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition duration-300 shadow-md shadow-teal-500/15 cursor-pointer disabled:opacity-50"
                        >
                          {submittingPlan ? 'Guardando...' : '🍳 Asignar Plan Alimenticio'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}

          </div>

        </div>

      </div>
      <NotificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
      />
    </div>
  );
}
