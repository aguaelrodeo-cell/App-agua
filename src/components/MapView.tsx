import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, PinType, WaterUser } from '../types';
import { Navigation, Plus, Droplet, Gauge, Wrench, Locate, CheckCircle2, ShieldAlert, Layers } from 'lucide-react';

interface MapViewProps {
  pins: MapPin[];
  currentGps: { lat: number; lng: number } | null;
  gpsAccuracy: number | null;
  selectedPin: MapPin | null;
  onSelectPin: (pin: MapPin) => void;
  isRecordModeActive: boolean;
  onToggleRecordMode: () => void;
  onMapClick: (lat: number, lng: number) => void;
  activeFilter: PinType | 'todos';
  onFilterChange: (type: PinType | 'todos') => void;
  onJumptoGps: () => void;
  mapFocusTrigger?: number;
}

// Component to handle map clicks when Record Mode is active
const MapClickHandler: React.FC<{
  isRecordModeActive: boolean;
  onMapClick: (lat: number, lng: number) => void;
}> = ({ isRecordModeActive, onMapClick }) => {
  useMapEvents({
    click(e) {
      if (isRecordModeActive) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Component to center map when selectedPin changes
const MapController: React.FC<{
  center: { lat: number; lng: number } | null;
  zoom?: number;
}> = ({ center, zoom = 16 }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], zoom, { duration: 1.2 });
    }
  }, [center, map, zoom]);
  return null;
};

// Component to instantly fly to GPS coords when locate button is pressed
const GpsJumpController: React.FC<{
  trigger?: number;
  coords: { lat: number; lng: number } | null;
}> = ({ trigger, coords }) => {
  const map = useMap();
  const coordsRef = React.useRef(coords);

  // Keep ref updated with latest coordinates
  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  useEffect(() => {
    if (trigger && trigger > 0 && coordsRef.current) {
      map.flyTo([coordsRef.current.lat, coordsRef.current.lng], 18, { animate: true, duration: 1.0 });
    }
  }, [trigger, map]);

  return null;
};

// Create custom Tailwind L.divIcon
const createPinIcon = (pin: MapPin, isSelected: boolean) => {
  let bgColor = '#3b82f6'; // blue-500
  let ringColor = 'rgba(59, 130, 246, 0.3)';
  let iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;

  if (pin.type === 'matriz') {
    bgColor = '#ef4444'; // red-500
    ringColor = 'rgba(239, 68, 68, 0.3)';
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
  } else if (pin.type === 'llave') {
    bgColor = '#10b981'; // emerald-500
    ringColor = 'rgba(16, 185, 129, 0.3)';
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
  }

  const size = isSelected ? 36 : 28;
  const shadow = isSelected ? '0 10px 25px -5px rgba(0,0,0,0.4)' : '0 4px 10px -2px rgba(0,0,0,0.2)';

  return L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${bgColor};
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: ${shadow}, 0 0 0 ${isSelected ? 6 : 0}px ${ringColor};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: translate(-50%, -50%) ${isSelected ? 'scale(1.15)' : 'scale(1)'};
      ">
        ${iconHtml}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const gpsUserIcon = L.divIcon({
  className: 'gps-user-marker',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="position: absolute; inset: -8px; background-color: rgba(59, 130, 246, 0.35); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; inset: 0; background-color: #2563eb; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 12px rgba(37,99,235,0.5);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const MapView: React.FC<MapViewProps> = ({
  pins,
  currentGps,
  gpsAccuracy,
  selectedPin,
  onSelectPin,
  isRecordModeActive,
  onToggleRecordMode,
  onMapClick,
  activeFilter,
  onFilterChange,
  onJumptoGps,
  mapFocusTrigger,
}) => {
  const [mapLayer, setMapLayer] = React.useState<'normal' | 'realista'>('normal');
  const filteredPins = pins.filter(p => activeFilter === 'todos' || p.type === activeFilter);

  const defaultCenter = currentGps || { lat: -34.2150, lng: -70.8240 };

  return (
    <main className="flex-1 relative bg-[#e5e7eb] h-full overflow-hidden select-none flex flex-col">
      {/* Leaflet Map */}
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={15}
        className="w-full h-full z-0 outline-none"
        zoomControl={false}
      >
        {mapLayer === 'normal' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        <MapClickHandler isRecordModeActive={isRecordModeActive} onMapClick={onMapClick} />
        
        {selectedPin && <MapController center={{ lat: selectedPin.lat, lng: selectedPin.lng }} zoom={18} />}
        <GpsJumpController trigger={mapFocusTrigger} coords={currentGps} />

        {/* Real-time GPS User Circle & Pin */}
        {currentGps && (
          <>
            <Circle
              center={[currentGps.lat, currentGps.lng]}
              radius={gpsAccuracy || 15}
              pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.15, color: '#2563eb', weight: 1 }}
            />
            <Marker position={[currentGps.lat, currentGps.lng]} icon={gpsUserIcon}>
              <Popup className="custom-popup">
                <div className="p-1 text-center font-sans">
                  <p className="font-bold text-xs text-blue-700">Tu Ubicación GPS en Tiempo Real</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Posición física actual para registrar medidor</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Placed Infrastructure Pins */}
        {filteredPins.map((pin) => {
          const isSelected = selectedPin?.id === pin.id;
          return (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={createPinIcon(pin, isSelected)}
              eventHandlers={{
                click: () => onSelectPin(pin),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white uppercase ${
                      pin.type === 'medidor' ? 'bg-blue-600' : pin.type === 'matriz' ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}>
                      {pin.type}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">{pin.meterNumber || ''}</span>
                  </div>
                  <p className="font-bold text-sm text-slate-900 mt-1">{pin.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                  </p>
                  {pin.type === 'medidor' && (
                    <p className="text-[11px] text-blue-600 font-bold mt-1.5 flex items-center gap-1">
                      <span>👆 Clic en el pin para registrar medición mensual</span>
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Mobile-Optimized Top-Right HUD Controls */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 flex flex-col items-end gap-2 z-10">
        <button
          onClick={onJumptoGps}
          className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-slate-700 hover:text-blue-600 border border-slate-200 transition-all cursor-pointer active:scale-95"
          title="Centrar mapa en mi posición GPS actual"
        >
          <Locate className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 animate-pulse" />
        </button>

        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-1 flex gap-1">
          <button
            onClick={() => setMapLayer('normal')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              mapLayer === 'normal'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Mapa Normal"
          >
            <span>🗺️</span>
            <span className="hidden xs:inline">Normal</span>
          </button>
          <button
            onClick={() => setMapLayer('realista')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              mapLayer === 'realista'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Satélite"
          >
            <span>🛰️</span>
            <span className="hidden xs:inline">Satélite</span>
          </button>
        </div>
      </div>

      {/* Unified Mobile Bottom Navigation Bar / Control Dock */}
      <div className="absolute bottom-3 left-2.5 right-2.5 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-end justify-between gap-2 z-10 pointer-events-none select-none">
        {/* Left Side: Horizontal Scrollable Type Filters */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-xl border border-slate-200 flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full sm:max-w-md shrink-0">
          <button
            onClick={() => onFilterChange('todos')}
            className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeFilter === 'todos' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({pins.length})
          </button>
          <button
            onClick={() => onFilterChange('medidor')}
            className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'medidor' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 shrink-0" />
            <span>Medidores</span>
          </button>
          <button
            onClick={() => onFilterChange('matriz')}
            className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'matriz' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 shrink-0" />
            <span>Matrices</span>
          </button>
          <button
            onClick={() => onFilterChange('llave')}
            className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'llave' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span>Llaves</span>
          </button>
        </div>

        {/* Right Side: + Registrar Pin FAB Button & Pulse Notification */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5 shrink-0">
          {isRecordModeActive && (
            <div className="bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-blue-500/40 animate-pulse flex items-center gap-2 max-w-full sm:max-w-[280px] text-left">
              <span className="text-base shrink-0">👆</span>
              <p className="text-xs font-medium leading-tight">Toca en cualquier parte del mapa para fijar el pin GPS</p>
            </div>
          )}

          <button
            onClick={onToggleRecordMode}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl border transition-all cursor-pointer active:scale-95 ${
              isRecordModeActive
                ? 'bg-blue-600 text-white border-blue-400 shadow-blue-600/30 ring-2 ring-blue-400/50'
                : 'bg-slate-900 text-white hover:bg-slate-800 border-slate-700 shadow-slate-900/20'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isRecordModeActive ? 'bg-amber-300 animate-ping' : 'bg-blue-400'}`} />
            <span className="text-xs font-black tracking-tight uppercase">
              {isRecordModeActive ? 'Modo Registro: ACTIVO' : '+ Registrar Pin GPS'}
            </span>
          </button>
        </div>
      </div>
    </main>
  );
};
