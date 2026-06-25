export type PinType = 'medidor' | 'matriz' | 'llave';

export interface MapPin {
  id: string;
  name: string;
  type: PinType;
  lat: number;
  lng: number;
  userId?: string; // If type is 'medidor'
  meterNumber?: string;
  createdAt: string;
  lastReading?: number;
  lastReadingDate?: string;
}

export interface MonthlyMeasurement {
  id: string;
  pinId: string;
  pinName: string;
  meterNumber?: string;
  monthYear: string; // e.g. "06/2026" or "Junio 2026"
  previousReading: number;
  currentReading: number;
  consumption: number; // currentReading - previousReading
  date: string;
  recordedBy: string;
  notes?: string;
}

export interface DriveFileInfo {
  id: string;
  name: string;
}

export interface WaterUser {
  id: string;
  name: string;
  meterNumber: string;
  address?: string;
}
