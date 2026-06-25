import { WaterUser, MapPin } from '../types';

// Centered around a typical rural water committee sector (El Rodeo / Central)
export const DEFAULT_CENTER = { lat: -34.2150, lng: -70.8240 };

const LAST_NAMES = [
  'González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martinez', 'Sepúlveda',
  'Morales', 'Rodriguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya', 'Flores', 'Espinoza', 'Valenzuela',
  'Castillo', 'Tapia', 'Reyes', 'Gutiérrez', 'Castro', 'Pizarro', 'Álvarez', 'Vásquez', 'Sánchez', 'Fernández'
];

const FIRST_NAMES = [
  'Juan', 'María', 'José', 'Ana', 'Carlos', 'Rosa', 'Luis', 'Carmen', 'Pedro', 'Laura',
  'Jorge', 'Marta', 'Manuel', 'Elena', 'Víctor', 'Lucía', 'Francisco', 'Claudia', 'Miguel', 'Patricia',
  'Héctor', 'Beatriz', 'Sergio', 'Teresa', 'Alejandro', 'Daniela', 'Eduardo', 'Verónica', 'Roberto', 'Lorena'
];

const SECTORS = ['Sector Las Rosas', 'Calle Principal', 'Camino El Estero', 'Pasaje Los Aromos', 'Sector Bajo', 'Loma Alta'];

export function generateInitial183Users(): WaterUser[] {
  const users: WaterUser[] = [];
  for (let i = 1; i <= 183; i++) {
    const meterNum = String(i).padStart(3, '0');
    const first = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const last1 = LAST_NAMES[(i * 13) % LAST_NAMES.length];
    const last2 = LAST_NAMES[(i * 19) % LAST_NAMES.length];
    const sector = SECTORS[i % SECTORS.length];
    
    users.push({
      id: `usr_${meterNum}`,
      meterNumber: `M-${meterNum}`,
      name: `${first} ${last1} ${last2}`,
      address: `${sector} #${100 + i * 12}`
    });
  }
  return users;
}

export function generateInitialPinsFromUsers(users: WaterUser[]): MapPin[] {
  // Scatter coordinates systematically along simulated rural roads
  return users.map((u, index) => {
    const angle = (index * 137.5) * (Math.PI / 180); // golden angle distribution
    const radius = 0.002 + (index * 0.00012); // outward spread (~3-4 km radius)
    const latOffset = Math.sin(angle) * radius;
    const lngOffset = Math.cos(angle) * radius * 1.2;

    return {
      id: `pin_${u.meterNumber}`,
      name: `${u.meterNumber} - ${u.name}`,
      type: 'medidor',
      lat: DEFAULT_CENTER.lat + latOffset,
      lng: DEFAULT_CENTER.lng + lngOffset,
      userId: u.id,
      meterNumber: u.meterNumber,
      createdAt: new Date(Date.now() - (183 - index) * 86400000).toISOString(),
      lastReading: 120 + Math.floor(Math.random() * 350),
      lastReadingDate: '2026-05-15'
    };
  });
}
