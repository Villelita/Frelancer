'use client';

import React from 'react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'success',
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}: NotificationModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '✨';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'error': return 'border-rose-500/30';
      case 'warning': return 'border-amber-500/30';
      case 'info': return 'border-indigo-500/30';
      default: return 'border-teal-500/30';
    }
  };

  const getButtonBg = () => {
    switch (type) {
      case 'error': return 'from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400';
      case 'warning': return 'from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400';
      case 'info': return 'from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400';
      default: return 'from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300';
    }
  };

  const isDarkText = type === 'success' || type === 'info' || type === 'warning';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className={`bg-slate-900 border ${getBorderColor()} p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl space-y-5 animate-in zoom-in duration-200`}>
        <span className="text-5xl block">{getIcon()}</span>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-white">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
        </div>

        {onConfirm ? (
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition duration-200 cursor-pointer active:scale-95 border border-slate-700"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 text-xs font-bold ${isDarkText ? 'text-slate-950' : 'text-white'} bg-gradient-to-r ${getButtonBg()} rounded-xl transition duration-200 shadow cursor-pointer active:scale-95`}
            >
              {confirmText}
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className={`w-full py-3 text-xs font-bold ${isDarkText ? 'text-slate-950' : 'text-white'} bg-gradient-to-r ${getButtonBg()} rounded-xl transition duration-200 shadow cursor-pointer active:scale-95`}
          >
            Aceptar
          </button>
        )}
      </div>
    </div>
  );
}
