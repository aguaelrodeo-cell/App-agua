import React, { useState } from 'react';
import { MonthlyMeasurement } from '../types';
import { X, FileSpreadsheet, Search, Calendar, Gauge, ExternalLink, HardDrive } from 'lucide-react';

interface HistoryModalProps {
  measurements: MonthlyMeasurement[];
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  measurements,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  const filtered = measurements.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.pinName.toLowerCase().includes(q) || (m.meterNumber && m.meterNumber.toLowerCase().includes(q)) || m.monthYear.includes(q);
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-emerald-700 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Historial Mensual de Consumo de Agua</h3>
              <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5 font-medium">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Sincronizado con Google Drive Sheets: <strong>Consumo_Mensual</strong></span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por usuario, medidor o mes (ej: 06/2026)..."
              className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-2 text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full w-4 h-4 flex items-center justify-center font-bold"
              >
                ×
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-4">
            <span className="font-bold">Total Registros: {filtered.length}</span>
            <a 
              href="https://drive.google.com" 
              target="_blank" 
              rel="noreferrer" 
              className="text-emerald-700 hover:underline font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>Abrir Drive Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No hay mediciones registradas que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Mes/Año</th>
                    <th className="py-3 px-4">Medidor</th>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4 text-right">Anterior</th>
                    <th className="py-3 px-4 text-right">Actual</th>
                    <th className="py-3 px-4 text-right font-black text-emerald-800">Consumo (m³)</th>
                    <th className="py-3 px-4">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">{m.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-700">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                          {m.monthYear}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{m.meterNumber || '-'}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 max-w-[200px] truncate">{m.pinName}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{m.previousReading}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">{m.currentReading}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-sm text-emerald-600 bg-emerald-50/40">
                        +{m.consumption} m³
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[120px] truncate">{m.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
          <span>Cada mes los consumos se archivan secuencialmente por usuario en Drive.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
