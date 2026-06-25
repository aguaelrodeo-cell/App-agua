import React, { useState } from 'react';
import { MapPin, MonthlyMeasurement } from '../types';
import { X, Save, FileSpreadsheet, Gauge, Calendar, User as UserIcon, Check } from 'lucide-react';

interface PinDetailModalProps {
  pin: MapPin;
  onClose: () => void;
  onSaveMeasurement: (measurement: MonthlyMeasurement) => void;
  onDeletePin: (pinId: string) => void;
}

export const PinDetailModal: React.FC<PinDetailModalProps> = ({
  pin,
  onClose,
  onSaveMeasurement,
  onDeletePin,
}) => {
  const currentMonthYear = new Date().toLocaleDateString('es-CL', { month: '2-digit', year: 'numeric' }); // e.g. "06/2026"
  const todayStr = new Date().toISOString().slice(0, 10);

  const prevRead = pin.lastReading || 120;
  const [currentReading, setCurrentReading] = useState<string>('');
  const [recordedBy, setRecordedBy] = useState<string>('Operador Terreno GPS');
  const [notes, setNotes] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const currNum = parseFloat(currentReading) || 0;
  const consumption = Math.max(0, currNum - prevRead);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReading) return;

    const newMeas: MonthlyMeasurement = {
      id: `meas_${Date.now()}`,
      pinId: pin.id,
      pinName: pin.name,
      meterNumber: pin.meterNumber,
      monthYear: currentMonthYear,
      previousReading: prevRead,
      currentReading: currNum,
      consumption: currNum > 0 ? currNum - prevRead : 0,
      date: todayStr,
      recordedBy: recordedBy.trim() || 'Operador GPS',
      notes: notes.trim(),
    };

    onSaveMeasurement(newMeas);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold rounded uppercase">
                  {pin.type}
                </span>
                <span className="font-mono text-xs text-slate-400">GPS: {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</span>
              </div>
              <h3 className="text-lg font-bold truncate max-w-[280px] mt-0.5">{pin.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info Banner */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Lectura Mes Anterior</p>
              <p className="text-lg font-mono font-bold text-slate-800">{prevRead} m³</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Consumo Calculado</p>
              <p className={`text-lg font-mono font-bold ${consumption > 50 ? 'text-rose-600' : 'text-blue-600'}`}>
                {currNum > 0 ? `${consumption} m³` : '0 m³'}
              </p>
            </div>
          </div>

          {/* New Reading */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Lectura de Agua Actual (m³) *</span>
              <span className="text-[11px] text-blue-600 font-normal">Registro Mensual ({currentMonthYear})</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                autoFocus
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                placeholder={`${prevRead + 15}`}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 text-xl font-mono font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-mono font-bold">m³</span>
            </div>
          </div>

          {/* Operator */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Registrado Por</label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Fecha Medición</label>
              <input
                type="date"
                value={todayStr}
                readOnly
                className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-600 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Observaciones / Anomalías</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Vidrio empañado, fuga visible, perro agresivo..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Excel Drive destination notice */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Historial guardado en Drive Google Sheets: <strong className="text-slate-700 italic">Consumo_Mensual_Medidores</strong>
            </span>
          </div>

          {currNum < prevRead && currNum > 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-bold">
              ⚠️ La lectura actual es menor a la anterior ({prevRead} m³). Verifica si el medidor dio la vuelta o es correcto.
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col xs:flex-row justify-between items-center gap-3 pt-2">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2 w-full xs:w-auto bg-rose-50 p-1.5 rounded-xl border border-rose-200">
                <span className="text-[11px] font-bold text-rose-700 px-1">¿Eliminar Pin?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDeletePin(pin.id);
                    onClose();
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg cursor-pointer transition-all shadow-xs"
                >
                  Sí, Borrar
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer hover:underline self-start xs:self-center"
              >
                🗑️ Eliminar Pin
              </button>
            )}

            <div className="flex gap-2 w-full xs:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 xs:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaved || !currentReading}
                className={`flex-1 xs:flex-none px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  isSaved 
                    ? 'bg-emerald-600 shadow-emerald-600/30 scale-95' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25 active:scale-95'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Guardado!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Registrar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
