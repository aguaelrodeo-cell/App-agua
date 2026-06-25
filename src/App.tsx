import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { WaterUser, MapPin, MonthlyMeasurement, PinType } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { PinDetailModal } from './components/PinDetailModal';
import { AddPinModal } from './components/AddPinModal';
import { NewUserModal } from './components/NewUserModal';
import { HistoryModal } from './components/HistoryModal';
import { initAuth, googleSignIn, logout } from './services/authService';
import {
  getStoredUsers,
  getStoredMeasurements,
  syncUsersWithDrive,
  addUserAndCreateDriveCopy,
  deleteUserAndCreateDriveCopy,
  appendMeasurementToSheets,
  getActiveFileName,
  syncPinsWithDrive,
  savePinsToDrive,
} from './services/driveService';
import { getStoredPins, saveStoredPins } from './services/pinService';

export default function App() {
  // Core Data Collections
  const [users, setUsers] = useState<WaterUser[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [measurements, setMeasurements] = useState<MonthlyMeasurement[]>([]);

  // Auth & Drive Status
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeFileName, setActiveFileName] = useState<string>('usuarios.txt (Base Original)');
  const [isSyncingDrive, setIsSyncingDrive] = useState<boolean>(false);

  // Map & Navigation Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<PinType | 'todos'>('todos');
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [selectedUser, setSelectedUser] = useState<WaterUser | null>(null);
  const [mapFocusTrigger, setMapFocusTrigger] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Real-time GPS Geolocation state
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number } | null>({ lat: -34.2150, lng: -70.8240 });
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Modal & Master Mode states
  const [isRecordModeActive, setIsRecordModeActive] = useState<boolean>(false);
  const [clickedMapCoords, setClickedMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // 1. Initialize local data & Auth listener on mount
  useEffect(() => {
    const loadedUsers = getStoredUsers();
    setUsers(loadedUsers);

    const loadedPins = getStoredPins(loadedUsers);
    setPins(loadedPins);

    const loadedMeas = getStoredMeasurements();
    setMeasurements(loadedMeas);

    setActiveFileName(getActiveFileName());

    // Listen to Firebase Auth state
    const unsubscribe = initAuth(
      async (user, token) => {
        setCurrentUser(user);
        handleDriveSync();
      },
      () => {
        setCurrentUser(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Real-time GPS Tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocalización no soportada por el navegador.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsActive(true);
        setCurrentGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsAccuracy(pos.coords.accuracy);
      },
      (err) => {
        console.warn('Error obteniendo GPS:', err.message);
        setGpsActive(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Sync Google Drive base txt
  const handleDriveSync = useCallback(async () => {
    setIsSyncingDrive(true);
    try {
      const res = await syncUsersWithDrive();
      if (res.users && res.users.length > 0) {
        setUsers(res.users);
        setActiveFileName(res.activeFile);
      }
      const drivePins = await syncPinsWithDrive();
      if (drivePins && drivePins.length > 0) {
        setPins(drivePins);
        saveStoredPins(drivePins);
      }
    } catch (e) {
      console.error('Drive sync failed:', e);
    } finally {
      setIsSyncingDrive(false);
    }
  }, []);

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    try {
      const authRes = await googleSignIn();
      if (authRes?.user) {
        setCurrentUser(authRes.user);
        handleDriveSync();
      }
    } catch (err) {
      console.error('Sign in error:', err);
      showToast('Asegúrate de conceder permisos de Google Drive y Sheets para sincronizar.');
    }
  };

  // Handle Google Sign Out
  const handleGoogleSignOut = async () => {
    await logout();
    setCurrentUser(null);
  };

  // Add Pin to map
  const handleConfirmAddPin = (newPin: MapPin) => {
    const updatedPins = [...pins, newPin];
    setPins(updatedPins);
    saveStoredPins(updatedPins);
    savePinsToDrive(updatedPins);

    setClickedMapCoords(null);
    setSelectedPin(newPin);
  };

  // Delete Pin from map
  const handleDeletePin = (pinId: string) => {
    const updatedPins = pins.filter(p => p.id !== pinId);
    setPins(updatedPins);
    saveStoredPins(updatedPins);
    savePinsToDrive(updatedPins);
    setSelectedPin(null);
  };

  // Add New User to committee (creates new Drive copy)
  const handleSaveNewUser = async (newUser: WaterUser) => {
    const res = await addUserAndCreateDriveCopy(newUser);
    setUsers(res.users);
    setActiveFileName(res.activeFile);

    // If we were selecting user for a pin, select this user
    setSelectedUser(newUser);
  };

  // Delete User from committee (creates new Drive copy)
  const handleDeleteUser = async (userId: string) => {
    const res = await deleteUserAndCreateDriveCopy(userId);
    setUsers(res.users);
    setActiveFileName(res.activeFile);
    if (selectedUser?.id === userId) setSelectedUser(null);
    showToast('Usuario eliminado de la base activa.');
  };

  // Save Monthly Water Measurement
  const handleSaveMeasurement = async (measurement: MonthlyMeasurement) => {
    // 1. Update pin lastReading
    const updatedPins = pins.map(p => {
      if (p.id === measurement.pinId) {
        return {
          ...p,
          lastReading: measurement.currentReading,
          lastReadingDate: measurement.date,
        };
      }
      return p;
    });
    setPins(updatedPins);
    saveStoredPins(updatedPins);
    savePinsToDrive(updatedPins);

    // 2. Update local state
    const newMeasList = [measurement, ...measurements];
    setMeasurements(newMeasList);

    // 3. Append to Google Sheets
    await appendMeasurementToSheets(measurement);
  };

  // Map Click handler in Record Mode
  const handleMapClick = (lat: number, lng: number) => {
    setClickedMapCoords({ lat, lng });
  };

  // Jump to current GPS
  const handleJumpToGps = () => {
    if (currentGps) {
      setSelectedPin(null);
      setCurrentGps({ ...currentGps });
      setMapFocusTrigger(Date.now());
    } else {
      showToast('Esperando señal GPS activa...');
    }
  };

  const nextMeterSeq = `M-${String(users.length + 1).padStart(3, '0')}`;

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-slate-800 antialiased select-none">
      {/* 1. Header Navigation */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        gpsActive={gpsActive}
        gpsAccuracy={gpsAccuracy}
        currentUser={currentUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        activeFileName={activeFileName}
        onSyncDrive={handleDriveSync}
        isSyncing={isSyncingDrive}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
        usersCount={users.length}
        isMobileSearchOpen={isMobileSearchOpen}
        onToggleMobileSearch={() => setIsMobileSearchOpen(prev => !prev)}
      />

      {/* Mobile Search Dropdown Bar (< md) */}
      {(isMobileSearchOpen || searchQuery) && (
        <div className="md:hidden bg-white border-b border-slate-200 px-3 py-2 z-20 shadow-xs animate-in slide-in-from-top duration-150 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar usuario, dirección o medidor..."
              className="w-full bg-slate-100 border border-slate-200 rounded-full py-1.5 pl-9 pr-8 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">🔍</span>
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-xs bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-full w-4 h-4 flex items-center justify-center font-black"
              >
                ×
              </button>
            ) : (
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="absolute right-2.5 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Workspace Layout */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 border border-slate-700 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <span>ℹ️</span>
          <span>{toastMsg}</span>
        </div>
      )}
      <div className="flex-1 flex relative overflow-hidden min-h-0">
        {/* Left Sidebar: Inventory & Users List (Desplegable Optativo) */}
        {isSidebarOpen && (
          <Sidebar
            users={users}
            pins={pins}
            selectedUser={selectedUser}
            onSelectUser={(u) => {
              setSelectedUser(u);
              const foundPin = pins.find(p => p.userId === u.id || p.meterNumber === u.meterNumber);
              if (foundPin) {
                setSelectedPin(foundPin);
              }
              if (window.innerWidth < 640) setIsSidebarOpen(false);
            }}
            onAddNewUser={() => setIsNewUserModalOpen(true)}
            onDeleteUser={handleDeleteUser}
            activeFileName={activeFileName}
            searchQuery={searchQuery}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Interactive GPS Leaflet Map Viewport */}
        <MapView
          pins={pins}
          currentGps={currentGps}
          gpsAccuracy={gpsAccuracy}
          selectedPin={selectedPin}
          onSelectPin={setSelectedPin}
          isRecordModeActive={isRecordModeActive}
          onToggleRecordMode={() => {
            setIsRecordModeActive(prev => !prev);
            setClickedMapCoords(null);
          }}
          onMapClick={handleMapClick}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onJumptoGps={handleJumpToGps}
          mapFocusTrigger={mapFocusTrigger}
        />
      </div>

      {/* 3. Footer Status */}
      <footer className="h-6 sm:h-8 bg-slate-100 border-t border-slate-200 px-3 sm:px-6 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 shrink-0 font-semibold select-none shadow-inner">
        <div className="flex gap-2 sm:gap-4 items-center truncate">
          <span className="flex items-center gap-1 sm:gap-1.5 text-slate-700 truncate">
            <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${currentUser ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            <span className="truncate">{currentUser ? 'Drive Conectado' : 'Modo Local (Sin Drive)'}</span>
          </span>
          <span>•</span>
          <span className="shrink-0">Medidores: <strong>{pins.filter(p => p.type === 'medidor').length}</strong></span>
        </div>

        <div className="flex gap-3 sm:gap-5 items-center shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 rounded-full border border-white shadow-2xs shrink-0"></span> 
            <span className="hidden xs:inline">Medidor</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-500 rounded-full border border-white shadow-2xs shrink-0"></span> 
            <span className="hidden xs:inline">Matriz</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full border border-white shadow-2xs shrink-0"></span> 
            <span className="hidden xs:inline">Llave</span>
          </span>
        </div>
      </footer>

      {/* 4. Modals */}
      {/* Pin Detail & Monthly Reading Modal */}
      {selectedPin && !clickedMapCoords && (
        <PinDetailModal
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          onSaveMeasurement={handleSaveMeasurement}
          onDeletePin={handleDeletePin}
        />
      )}

      {/* Add Pin Modal (Triggered by Map Click in Record Mode) */}
      {clickedMapCoords && (
        <AddPinModal
          coords={clickedMapCoords}
          users={users}
          onClose={() => setClickedMapCoords(null)}
          onConfirmPin={handleConfirmAddPin}
          onOpenNewUserModal={() => setIsNewUserModalOpen(true)}
        />
      )}

      {/* New User Modal (Drive copy creator) */}
      {isNewUserModalOpen && (
        <NewUserModal
          nextMeterNumber={nextMeterSeq}
          onClose={() => setIsNewUserModalOpen(false)}
          onSaveNewUser={handleSaveNewUser}
        />
      )}

      {/* Monthly Consumption Sheets History Modal */}
      {isHistoryModalOpen && (
        <HistoryModal
          measurements={measurements}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
    </div>
  );
}
