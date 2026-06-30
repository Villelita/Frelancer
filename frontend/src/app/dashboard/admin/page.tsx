'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config';
import NotificationModal from '../../../components/NotificationModal';

interface NutriologoStat {
  id: string;
  nombre: string;
  email: string;
  cedulaProf: string;
  especialidades: string[];
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
  pacientesCount: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  
  // Lista de nutriólogos
  const [nutriologos, setNutriologos] = useState<NutriologoStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulario para dar de alta nuevo nutriólogo
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cedulaProf, setCedulaProf] = useState('');
  const [especialidadesInput, setEspecialidadesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estados para Modal de Notificaciones
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [modalConfirmCallback, setModalConfirmCallback] = useState<(() => void) | undefined>(undefined);

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalConfirmCallback(undefined);
    setModalOpen(true);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType('warning');
    setModalConfirmCallback(() => onConfirm);
    setModalOpen(true);
  };

  // Verificar autenticación de Administrador
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedEmail = localStorage.getItem('userEmail');

    if (!savedToken || savedRole !== 'ADMIN_NUTRIOLOGO' || savedEmail !== 'admin@nutrition.com') {
      router.push('/login');
    } else {
      setToken(savedToken);
      fetchNutriologos(savedToken);
    }
  }, [router]);

  // Obtener lista de nutriólogos
  const fetchNutriologos = async (savedToken: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/nutriologos`, {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar la lista de especialistas.');
      }

      const data = await response.json();
      setNutriologos(data);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo nutriólogo
  const handleCreateNutriologo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setSubmitting(true);
      setError(null);

      const specialtiesArray = especialidadesInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const response = await fetch(`${API_BASE_URL}/api/auth/admin/nutriologos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre,
          email,
          password,
          cedulaProf,
          especialidades: specialtiesArray,
          role: 'ADMIN_NUTRIOLOGO'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al dar de alta al especialista.');
      }

      showNotification('Registro Exitoso', '¡Especialista registrado con éxito! Credenciales creadas.', 'success');
      
      // Limpiar formulario y refrescar lista
      setNombre('');
      setEmail('');
      setPassword('');
      setCedulaProf('');
      setEspecialidadesInput('');
      fetchNutriologos(token);
    } catch (err: any) {
      setError(err.message || 'Error de red al registrar.');
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar especialista
  const handleDeleteNutriologo = (id: string, nombre: string) => {
    if (!token) return;
    showConfirm(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar permanentemente al especialista "${nombre}"? Esta acción borrará todas sus citas y pacientes asociados en Supabase.`,
      async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/admin/nutriologos/delete/${id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Error al eliminar especialista.');
          }

          showNotification('Eliminación Exitosa', 'Especialista eliminado con éxito del sistema.', 'success');
          fetchNutriologos(token);
        } catch (err: any) {
          showNotification('Error al Eliminar', err.message || 'Error al eliminar.', 'error');
        }
      }
    );
  };

  // Actualizar el plan de un especialista
  const handleUpdatePlan = async (id: string, newPlan: string) => {
    if (!token) return;
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/nutriologos/${id}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: newPlan })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al actualizar el plan.');
      }

      showNotification('Plan Actualizado', `El plan del especialista ha sido cambiado a ${newPlan} con éxito.`, 'success');
      fetchNutriologos(token);
    } catch (err: any) {
      showNotification('Error al Actualizar Plan', err.message || 'Error de red.', 'error');
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
            <span className="px-2.5 py-1 text-xs font-semibold tracking-wider text-rose-400 bg-rose-400/10 rounded-full border border-rose-500/20 uppercase font-mono">
              Administración de Sistema
            </span>
            <h1 className="text-2xl font-black text-white mt-1">Panel de Credenciales</h1>
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

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-8 text-xs leading-relaxed max-w-xl">
            {error}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulario de Registro (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold text-white mb-2">🩺 Emitir Credenciales</h2>
              <p className="text-xs text-slate-400 mb-6">Completa el formulario para registrar un especialista y crear su perfil multi-tenant en Supabase.</p>
              
              <form onSubmit={handleCreateNutriologo} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre Completo</label>
                  <input
                    type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Dr. Alejandro Silva"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Correo Electrónico (Login)</label>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@nutrition.com"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Contraseña Inicial</label>
                  <input
                    type="text" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Cédula Profesional</label>
                  <input
                    type="text" required value={cedulaProf} onChange={(e) => setCedulaProf(e.target.value)}
                    placeholder="Ej. 12345678"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Especialidades (separadas por comas)</label>
                  <input
                    type="text" value={especialidadesInput} onChange={(e) => setEspecialidadesInput(e.target.value)}
                    placeholder="Ej. Nutrición Deportiva, Recomposición"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition duration-300 shadow-md shadow-teal-500/15 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {submitting ? 'Registrando...' : '🚀 Dar de Alta Especialista'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Listado de Nutriólogos Activos (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold text-white mb-2">👥 Especialistas Registrados</h2>
              <p className="text-xs text-slate-400 mb-6">Listado de cuentas habilitadas en el sistema para control multi-tenant y de facturación.</p>

              {loading ? (
                <div className="text-center py-12 text-slate-500 animate-pulse">Cargando especialistas...</div>
              ) : nutriologos.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center border border-dashed border-slate-800 rounded-xl">No hay especialistas registrados en el sistema.</p>
              ) : (
                <div className="space-y-4">
                  {nutriologos.map((nutri) => (
                    <div
                      key={nutri.id}
                      className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl hover:border-slate-700/60 transition duration-200 flex justify-between items-center gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white">{nutri.nombre}</h3>
                          <span className="text-[9px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/50">
                            Cédula: {nutri.cedulaProf}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{nutri.email}</p>
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {nutri.especialidades.map((esp, i) => (
                            <span key={i} className="text-[9px] font-semibold text-teal-400 bg-teal-400/5 px-2 py-0.5 rounded border border-teal-500/10">
                              {esp}
                            </span>
                          ))}
                          {nutri.especialidades.length === 0 && (
                            <span className="text-[9px] font-medium text-slate-600">Sin especialidades</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 pt-1">
                          Registrado: {new Date(nutri.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>

                        {nutri.email !== 'admin@nutrition.com' && (
                          <div className="pt-2.5 flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Plan Contratado:</span>
                            <select
                              value={nutri.plan || 'ENTERPRISE'}
                              onChange={(e) => handleUpdatePlan(nutri.id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 text-teal-400 text-[10px] font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-teal-500/50 cursor-pointer transition-colors duration-200"
                            >
                              <option value="STARTER" className="text-amber-500">🥉 Starter</option>
                              <option value="PRO" className="text-slate-300">🥈 Pro</option>
                              <option value="ENTERPRISE" className="text-teal-400 font-bold">🥇 Enterprise</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-lg font-black text-white">{nutri.pacientesCount}</span>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pacientes</p>
                        </div>

                        {nutri.email !== 'admin@nutrition.com' && (
                          <button
                            onClick={() => handleDeleteNutriologo(nutri.id, nutri.nombre)}
                            className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer active:scale-95 shadow"
                            title="Eliminar Credenciales"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
      <NotificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onConfirm={modalConfirmCallback}
      />
    </div>
  );
}
