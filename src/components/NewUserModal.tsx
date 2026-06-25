import React, { useState } from 'react';
import { WaterUser } from '../types';
import { X, UserPlus, HardDrive, Check } from 'lucide-react';

interface NewUserModalProps {
  onClose: () => void;
  onSaveNewUser: (user: WaterUser) => Promise<void>;
  nextMeterNumber: string;
}

export const NewUserModal: React.FC<NewUserModalProps> = ({
  onClose,
  onSaveNewUser,
  nextMeterNumber,
}) => {
  const [name, setName] = useState('');
  const [meterNum, setMeterNum] = useState(nextMeterNumber);
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    const newUser: WaterUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      meterNumber: meterNum.trim() || `M-${Date.now().toString().slice(-4)}`,
      address: address.trim() || 'Sector Rural Nuevo',
    };

    await onSaveNewUser(newUser);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Nuevo Usuario de Agua</h3>
              <p className="text-[11px] text-blue-300">Base Google Drive: usuarios.txt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-2 text-xs text-blue-800">
            <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Al guardar, se creará una <strong>nueva copia del archivo txt</strong> en Google Drive preservando la base intacta.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              N° de Medidor Asignado
            </label>
            <input
              type="text"
              required
              value={meterNum}
              onChange={(e) => setMeterNum(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nombre Completo del Usuario *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Claudio Araya Sepúlveda"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sector / Dirección (Opcional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Camino El Estero #420"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-blue-600/25 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Creando Copia Drive...' : 'Agregar Usuario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
