import React, { useState } from 'react';
import { PinType, WaterUser, MapPin } from '../types';
import { X, MapPin as PinIcon, Users, Droplet, Wrench, Gauge, PlusCircle, Check } from 'lucide-react';

interface AddPinModalProps {
  coords: { lat: number; lng: number };
  users: WaterUser[];
  onClose: () => void;
  onConfirmPin: (pin: MapPin) => void;
  onOpenNewUserModal: () => void;
}

export const AddPinModal: React.FC<AddPinModalProps> = ({
  coords,
  users,
  onClose,
  onConfirmPin,
  onOpenNewUserModal,
}) => {
  const [pinType, setPinType] = useState<PinType>('medidor');
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [customName, setCustomName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    let name = '';
    let meterNumber: string | undefined = undefined;
    let userId: string | undefined = undefined;

    if (pinType === 'medidor') {
      if (!selectedUser) {
        setErrorMsg('Debes seleccionar un usuario o agregar uno nuevo.');
        return;
      }
      name = `${selectedUser.meterNumber} - ${selectedUser.name}`;
      meterNumber = selectedUser.meterNumber;
      userId = selectedUser.id;
    } else {
      if (!customName.trim()) {
        setErrorMsg('Ingresa un nombre específico para esta matriz o llave.');
        return;
      }
      name = customName.trim();
    }

    const newPin: MapPin = {
      id: `pin_${Date.now()}`,
      name,
      type: pinType,
      lat: coords.lat,
      lng: coords.lng,
      userId,
      meterNumber,
      createdAt: new Date().toISOString(),
      lastReading: pinType === 'medidor' ? 120 : undefined,
    };

    onConfirmPin(newPin);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <PinIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Marcar Nuevo Pin GPS</h3>
              <p className="text-[11px] text-blue-100 font-mono">
                Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-blue-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirm} className="p-5 md:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          {/* Type selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Tipo de Elemento a Registrar
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPinType('medidor')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  pinType === 'medidor'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <Gauge className="w-5 h-5" />
                <span className="text-xs font-bold">Medidor</span>
              </button>

              <button
                type="button"
                onClick={() => setPinType('matriz')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  pinType === 'matriz'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <Droplet className="w-5 h-5" />
                <span className="text-xs font-bold">Matriz</span>
              </button>

              <button
                type="button"
                onClick={() => setPinType('llave')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  pinType === 'llave'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <Wrench className="w-5 h-5" />
                <span className="text-xs font-bold">Llave</span>
              </button>
            </div>
          </div>

          {/* Conditional Input */}
          {pinType === 'medidor' ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Seleccionar Usuario (Drive txt)
                </label>
                <button
                  type="button"
                  onClick={onOpenNewUserModal}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Agregar Usuario</span>
                </button>
              </div>

              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.meterNumber} - {u.name}
                  </option>
                ))}
              </select>

              {selectedUser && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-slate-600">
                  <p><strong>Dirección:</strong> {selectedUser.address || 'Sector Rural'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Al marcar, este medidor quedará fijado en tu posición física en el mapa.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nombre o Identificador Específico
              </label>
              <input
                type="text"
                required
                autoFocus
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={pinType === 'matriz' ? 'Ej: Matriz Principal 110mm Sector Centro' : 'Ej: Llave de Paso Cortafuego Pasaje 4'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400">
                Se mostrará con un icono diferenciado en el mapa de infraestructura.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-blue-600/25 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Colocar Pin Aquí</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
