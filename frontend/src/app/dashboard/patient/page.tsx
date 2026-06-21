'use client';

import React, { useState } from 'react';

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
  // Datos simulados (mock) de alta fidelidad para representar el estado de la aplicación
  const [paciente] = useState({
    nombre: 'Valeria Alarcón',
    edad: 28,
    estatura: 1.68,
    genero: 'Femenino',
    nutriologo: 'Dr. Alejandro Silva (Nutrición Clínica y Deportiva)',
    proximaCita: '28 de Junio, 2026 - 17:00'
  });

  const [historial] = useState<HistorialMetrico[]>([
    { id: '1', fecha: '21 Jun 2026', peso: 62.5, grasa: 22.1, musculo: 38.4, agua: 53.2, pliegueAbdominal: 14, cambioPeso: -0.8 },
    { id: '2', fecha: '07 Jun 2026', peso: 63.3, grasa: 22.9, musculo: 37.9, agua: 52.8, pliegueAbdominal: 15, cambioPeso: -1.1 },
    { id: '3', fecha: '24 May 2026', peso: 64.4, grasa: 23.8, musculo: 37.5, agua: 52.1, pliegueAbdominal: 17, cambioPeso: -0.9 },
    { id: '4', fecha: '10 May 2026', peso: 65.3, grasa: 24.5, musculo: 37.0, agua: 51.8, pliegueAbdominal: 18 }
  ]);

  const [planActivo] = useState<PlanAlimenticio>({
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
  });

  const [activeTab, setActiveTab] = useState<'comidas' | 'analisis'>('comidas');

  // Cálculo de metas rápidas
  const ultimaMetrica = historial[0];
  const primeraMetrica = historial[historial.length - 1];
  const pesoPerdidoTotal = (primeraMetrica.peso - ultimaMetrica.peso).toFixed(1);
  const grasaPerdidaTotal = (primeraMetrica.grasa - ultimaMetrica.grasa).toFixed(1);
  const musculoGanadoTotal = (ultimaMetrica.musculo - primeraMetrica.musculo).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* Fondo decorativo con gradientes abstractos */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-950/30 via-teal-950/10 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-80 left-10 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Premium */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-8 border-b border-slate-800/80 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-xs font-semibold tracking-wider text-teal-400 bg-teal-400/10 rounded-full border border-teal-500/20 uppercase">
                Paciente Premium
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
              Hola, {paciente.nombre} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Tu seguimiento de composición corporal y plan nutricional personalizado.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl w-full md:w-auto shadow-lg shadow-slate-950/50">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Próxima Consulta</p>
              <p className="text-sm font-medium text-white">{paciente.proximaCita}</p>
            </div>
          </div>
        </header>

        {/* Resumen de Progreso de Alto Impacto */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1 - Peso */}
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl transition hover:border-slate-700/80 shadow-md">
            <div className="absolute top-0 right-0 p-3 opacity-10 text-teal-400">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">Peso Corporal Actual</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-white">{ultimaMetrica.peso}</span>
              <span className="text-lg font-semibold text-slate-400">kg</span>
              <span className="ml-auto flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                ↓ {pesoPerdidoTotal} kg total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Última actualización: {ultimaMetrica.fecha}</p>
          </div>

          {/* Card 2 - Porcentaje Grasa */}
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl transition hover:border-slate-700/80 shadow-md">
            <div className="absolute top-0 right-0 p-3 opacity-10 text-indigo-400">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">Porcentaje de Grasa</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-white">{ultimaMetrica.grasa}%</span>
              <span className="ml-auto flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                ↓ {grasaPerdidaTotal}% total
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3.5">
              <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${ultimaMetrica.grasa}%` }} />
            </div>
          </div>

          {/* Card 3 - Porcentaje Músculo */}
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl transition hover:border-slate-700/80 shadow-md">
            <div className="absolute top-0 right-0 p-3 opacity-10 text-rose-400">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">Masa Muscular Esquelética</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-white">{ultimaMetrica.musculo}%</span>
              <span className="ml-auto flex items-center text-xs font-semibold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                ↑ {musculoGanadoTotal}% total
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3.5">
              <div className="bg-teal-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${ultimaMetrica.musculo}%` }} />
            </div>
          </div>
        </section>

        {/* Sección de Selección de Módulo (Tabs) */}
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
            
            {/* Detalles del Plan (Columna Izquierda / 2 Tercios) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">{planActivo.nombre}</h2>
                    <p className="text-xs text-slate-400 mt-1">Activo desde el {planActivo.fechaInicio}</p>
                  </div>
                  
                  {/* Botón de descarga de PDF */}
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

                {/* Comidas detalladas */}
                <div className="space-y-6">
                  {planActivo.comidas.map((comida, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-indigo-500/30 hover:border-indigo-400 transition-all duration-300">
                      {/* Indicador del punto temporal */}
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

            {/* Sidebar de Resumen Nutricional (Columna Derecha / 1 Tercio) */}
            <div className="space-y-6">
              {/* Card Macros */}
              <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4">Metas Diarias de Energía</h3>
                
                {/* Calorías totales */}
                <div className="text-center py-6 border-b border-slate-800">
                  <span className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
                    {planActivo.caloriasTotales}
                  </span>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Kilocalorías</p>
                </div>

                {/* Macronutrientes */}
                <div className="mt-6 space-y-4">
                  {/* Carbos */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-indigo-400">🌾 Carbohidratos (45%)</span>
                      <span className="text-slate-200">208g / día</span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>

                  {/* Proteína */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-teal-400">🥩 Proteínas (30%)</span>
                      <span className="text-slate-200">138g / día</span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-2">
                      <div className="bg-teal-400 h-2 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>

                  {/* Grasas */}
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

              {/* Card Soporte / Nutriólogo */}
              <div className="bg-gradient-to-br from-indigo-950/20 via-slate-900/30 to-teal-950/20 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-2">Tu Nutriólogo</h3>
                <p className="text-sm text-slate-300 font-semibold">{paciente.nutriologo}</p>
                
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs text-slate-400 font-medium">Asesoría activa de plan alimenticio</span>
                </div>
                
                <button
                  onClick={() => alert('Abriendo el chat interactivo para resolver dudas del plan...')}
                  className="w-full mt-5 px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition duration-300 tracking-wide"
                >
                  💬 Enviar Mensaje
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* Historial Antropométrico (Composición Corporal) */
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Historial de Mediciones</h2>
                <p className="text-xs text-slate-400 mt-1">Evolución antropométrica registrada en consulta clínica.</p>
              </div>
            </div>

            {/* Tabla interactiva premium */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-4">Fecha</th>
                    <th className="py-4 px-4 text-right">Peso (kg)</th>
                    <th className="py-4 px-4 text-right">Dif. Peso</th>
                    <th className="py-4 px-4 text-right">Grasa (%)</th>
                    <th className="py-4 px-4 text-right">Músculo (%)</th>
                    <th className="py-4 px-4 text-right">Agua (%)</th>
                    <th className="py-4 px-4 text-right">Pliegue Abd. (mm)</th>
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
                      <td className="py-4 px-4 text-right text-slate-400">{reg.agua || '-'}%</td>
                      <td className="py-4 px-4 text-right text-slate-400">{reg.pliegueAbdominal || '-'} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Micro-insights clínicos del progreso */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
              <div className="flex gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 self-start">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Excelente Recomposición</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Estás perdiendo masa grasa de forma constante mientras mantienes e incrementas tu porcentaje de músculo. Esto indica un excelente nivel de adhesión al plan nutricional y al entrenamiento.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 self-start">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Reducción de Pliegues</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Tu pliegue abdominal ha disminuido {primeraMetrica.pliegueAbdominal && ultimaMetrica.pliegueAbdominal ? primeraMetrica.pliegueAbdominal - ultimaMetrica.pliegueAbdominal : 0} mm desde la primera consulta. Esto confirma una pérdida real de grasa subcutánea localizada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
