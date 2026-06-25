import React from 'react';
import { Search, Navigation, HardDrive, UserCheck, LogOut, FileSpreadsheet } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  gpsActive: boolean;
  gpsAccuracy: number | null;
  currentUser: User | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  activeFileName: string;
  onSyncDrive: () => void;
  isSyncing: boolean;
  onOpenHistory: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  usersCount: number;
  isMobileSearchOpen?: boolean;
  onToggleMobileSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  gpsActive,
  gpsAccuracy,
  currentUser,
  onGoogleSignIn,
  onGoogleSignOut,
  onOpenHistory,
  onToggleSidebar,
  isSidebarOpen,
  usersCount,
  isMobileSearchOpen,
  onToggleMobileSearch,
}) => {
  return (
    <header className="h-13 md:h-14 bg-white border-b border-slate-200 flex items-center justify-between px-2.5 md:px-6 z-30 shrink-0 select-none shadow-xs relative">
      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/20 shrink-0">
          <Navigation className="w-4 h-4 md:w-5 md:h-5 fill-white stroke-white rotate-45" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm md:text-lg font-black leading-none tracking-tight text-slate-900">AquaTrack</h1>
            <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">Móvil</span>
          </div>
          <p className="text-[9px] md:text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-extrabold flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${gpsActive ? 'bg-blue-600 animate-ping' : 'bg-amber-500'}`} />
            <span>GPS v2.5</span>
          </p>
        </div>
      </div>

      {/* Desktop Search Input (Hidden on mobile < md) */}
      <div className="hidden md:block flex-1 max-w-md mx-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar usuario o medidor..."
            className="w-full bg-slate-100 border-none rounded-full py-1.5 pl-9 pr-4 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1.5 text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full w-4 h-4 flex items-center justify-center font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right Action Bar (Mobile-optimized quick icons) */}
      <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
        {/* Mobile Search Toggle Icon Button */}
        <button
          onClick={onToggleMobileSearch}
          className={`md:hidden p-2 rounded-xl border text-slate-700 transition-colors ${
            isMobileSearchOpen || searchQuery
              ? 'bg-blue-50 border-blue-300 text-blue-600'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
          }`}
          title="Buscar"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* History Modal Icon Button */}
        <button
          onClick={onOpenHistory}
          className="p-2 md:px-3 md:py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Ver historial mensual en Sheets"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="hidden lg:inline">Historial</span>
        </button>

        {/* Toggle Users Sidebar Button */}
        <button
          onClick={onToggleSidebar}
          className={`flex items-center gap-1.5 p-2 md:px-3 md:py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
            isSidebarOpen
              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/20'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
          }`}
          title="Directorio e inventario"
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Usuarios</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            isSidebarOpen ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
          }`}>
            {usersCount}
          </span>
        </button>

        {/* Drive Status / Connect Button */}
        {currentUser ? (
          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-1 md:px-2.5 rounded-xl text-emerald-800 text-[11px] font-bold">
            <HardDrive className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Drive OK</span>
            <button
              onClick={onGoogleSignOut}
              className="text-slate-400 hover:text-rose-600 p-0.5 ml-0.5 rounded cursor-pointer"
              title="Cerrar sesión Drive"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onGoogleSignIn}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2 py-1.5 md:px-2.5 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            title="Conectar Google Drive"
          >
            <HardDrive className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">Drive</span>
          </button>
        )}
      </div>
    </header>
  );
};
