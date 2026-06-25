import { MapPin, WaterUser } from '../types';

const LOCAL_STORAGE_PINS_KEY = 'aquatrack_pins_manual_v1';

export function getStoredPins(users: WaterUser[]): MapPin[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_PINS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing stored pins', e);
    }
  }
  // Retornar arreglo vacío por defecto para que el usuario agregue manualmente los pins
  return [];
}

export function saveStoredPins(pins: MapPin[]) {
  localStorage.setItem(LOCAL_STORAGE_PINS_KEY, JSON.stringify(pins));
}

