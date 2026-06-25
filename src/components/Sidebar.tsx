import React, { useState } from 'react';
import { WaterUser, MapPin } from '../types';
import { Users, Droplet, Gauge, Wrench, HardDrive, Plus, MapPin as PinIcon, Trash2, AlertTriangle, X } from 'lucide-react';

interface SidebarProps {
  users: WaterUser[];
  pins: MapPin[];
  selectedUser: WaterUser | null;
  onSelectUser: (user: WaterUser) => void;
  onAddNewUser: () => void;
  onDeleteUser: (userId: string) => void;
  activeFileName: string;
  searchQuery: string;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  users,
  pins,
  selectedUser,
  onSelectUser,
  onAddNewUser,
  onDeleteUser,
  activeFileName,
  searchQuery,
  onClose,
}) => {
  const [userToDelete, setUserToDelete] = useState<WaterUser | null>(null);

  // Count counts
  const medidoresCount = pins.filter(p => p.type === 'medidor').length;
  const matricesCount = pins.filter(p => p.type === 'matriz').length;
  const llavesCount = pins.filter(p => p.type === 'llave').length;

  // Filter users by search
  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.meterNumber.toLowerCase().includes(q) || (u.address && u.address.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-40 flex animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <aside className="relative z-50 w-full sm:w-85 max-w-[88vw] bg-white border-r border-slate-200 p-4 flex flex-col gap-4 select-none h-full shadow-2xl overflow-hidden animate-in slide-in-from-left duration-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">Directorio e Inventario</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-black text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
            title="Cerrar panel de usuarios"
          >
            ✕ <span className="text-[10px] uppercase">Cerrar</span>
          </button>
        )}
      </div>

      {/* Inventory Section */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-blue-500" />
          <span>Inventario Total</span>
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 flex flex-col items-center">
            <p className="text-xl font-bold text-blue-600">{medidoresCount}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Medidores</p>
          </div>
          <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-100 flex flex-col items-center">
            <p className="text-xl font-bold text-rose-600">{matricesCount}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Matrices</p>
          </div>
          <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 flex flex-col items-center">
            <p className="text-xl font-bold text-emerald-600">{llavesCount}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Llaves</p>
          </div>
        </div>
      </section>

      {/* Users List from Google Drive txt */}
      <section className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Usuarios Drive ({filteredUsers.length})</span>
          </h2>
          <button
            onClick={onAddNewUser}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo</span>
          </button>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              No se encontraron usuarios con "{searchQuery}"
            </div>
          ) : (
            filteredUsers.map((u) => {
              const hasPin = pins.some(p => p.userId === u.id || p.meterNumber === u.meterNumber);
              const isSelected = selectedUser?.id === u.id;

              return (
                <div
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <p className={`text-sm font-bold truncate pr-1 ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                      {u.name}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {u.meterNumber}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserToDelete(u);
                        }}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer"
                        title="Eliminar usuario de la base"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                      {u.address || 'Sector Rural'}
                    </p>
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${hasPin ? 'text-emerald-600' : 'text-amber-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasPin ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                      {hasPin ? 'Con Pin GPS' : 'Pendiente GPS'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Confirmation Modal: ¿Estás seguro? */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 shrink-0" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">¿Estás seguro?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Estás a punto de eliminar al usuario <strong>{userToDelete.name}</strong> (Medidor #{userToDelete.meterNumber}) de la lista.
              <br /><br />
              Se generará una <strong>nueva copia en Google Drive</strong> preservando tu archivo txt original intacto.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 rounded-xl transition-all cursor-pointer"
              >
                Sí, quitar usuario
              </button>
            </div>
          </div>
        </div>
      )}
      </aside>
    </div>
  );
};
