import { WaterUser, MonthlyMeasurement, MapPin } from '../types';
import { getAccessToken } from './authService';
import { generateInitial183Users } from '../data/initialUsers';

const LOCAL_STORAGE_USERS_KEY = 'aquatrack_users_v1';
const LOCAL_STORAGE_PINS_KEY = 'aquatrack_pins_v1';
const LOCAL_STORAGE_MEASUREMENTS_KEY = 'aquatrack_measurements_v1';
const LOCAL_STORAGE_ACTIVE_FILE_KEY = 'aquatrack_active_drive_file';

export interface DriveSyncStatus {
  isConnected: boolean;
  activeFileName: string;
  lastSyncTime: string;
  isSyncing: boolean;
}

// Helper to get or initialize users in localStorage
export function getStoredUsers(): WaterUser[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored users', e);
    }
  }
  const initial = generateInitial183Users();
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(initial));
  return initial;
}

export function saveStoredUsers(users: WaterUser[]) {
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
}

export function getStoredMeasurements(): MonthlyMeasurement[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_MEASUREMENTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return [];
}

export function saveStoredMeasurements(measurements: MonthlyMeasurement[]) {
  localStorage.setItem(LOCAL_STORAGE_MEASUREMENTS_KEY, JSON.stringify(measurements));
}

export function getActiveFileName(): string {
  return localStorage.getItem(LOCAL_STORAGE_ACTIVE_FILE_KEY) || 'usuarios.txt (Base Original)';
}

export function setActiveFileName(name: string) {
  localStorage.setItem(LOCAL_STORAGE_ACTIVE_FILE_KEY, name);
}

// Drive Backup for Manually Placed Pins
export async function syncPinsWithDrive(): Promise<MapPin[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name = 'medidores_pins_mapa.json' and trashed = false`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        const fileRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${data.files[0].id}?alt=media`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (fileRes.ok) {
          const pins = await fileRes.json();
          if (Array.isArray(pins)) return pins;
        }
      }
    }
  } catch (err) {
    console.error('Error syncing pins with Drive:', err);
  }
  return [];
}

export async function savePinsToDrive(pins: MapPin[]): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name = 'medidores_pins_mapa.json' and trashed = false`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    let fileId = '';
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        fileId = data.files[0].id;
      }
    }

    const jsonContent = JSON.stringify(pins, null, 2);
    if (fileId) {
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: jsonContent
      });
    } else {
      const metadata = { name: 'medidores_pins_mapa.json', mimeType: 'application/json' };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([jsonContent], { type: 'application/json' }));

      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
    }
  } catch (e) {
    console.error('Error saving pins to Drive:', e);
  }
}

// Drive API integration
export async function syncUsersWithDrive(): Promise<{ users: WaterUser[]; activeFile: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { users: getStoredUsers(), activeFile: getActiveFileName() };
  }

  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name contains 'usuarios' and mimeType = 'text/plain' and trashed = false&orderBy=createdTime desc`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      const files = data.files || [];

      if (files.length > 0) {
        const latestFile = files[0];
        const fileContentRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${latestFile.id}?alt=media`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (fileContentRes.ok) {
          const text = await fileContentRes.text();
          const parsedUsers = parseTxtToUsers(text);
          if (parsedUsers.length > 0) {
            saveStoredUsers(parsedUsers);
            setActiveFileName(latestFile.name);
            return { users: parsedUsers, activeFile: latestFile.name };
          }
        }
      }
    }

    const localUsers = getStoredUsers();
    await uploadNewUserBaseCopy(localUsers, 'usuarios.txt');
    setActiveFileName('usuarios.txt');
    return { users: localUsers, activeFile: 'usuarios.txt' };
  } catch (err) {
    console.error('Error syncing with Drive:', err);
    return { users: getStoredUsers(), activeFile: getActiveFileName() };
  }
}

export async function addUserAndCreateDriveCopy(newUser: WaterUser): Promise<{ users: WaterUser[]; activeFile: string }> {
  const currentUsers = getStoredUsers();
  const updatedUsers = [...currentUsers, newUser];
  saveStoredUsers(updatedUsers);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const copyName = `usuarios_copia_${dateStr}_(${updatedUsers.length}).txt`;
  setActiveFileName(copyName);

  const token = await getAccessToken();
  if (token) {
    try {
      await uploadNewUserBaseCopy(updatedUsers, copyName);
    } catch (e) {
      console.error('Error creating Drive copy:', e);
    }
  }

  return { users: updatedUsers, activeFile: copyName };
}

export async function deleteUserAndCreateDriveCopy(userId: string): Promise<{ users: WaterUser[]; activeFile: string }> {
  const currentUsers = getStoredUsers();
  const updatedUsers = currentUsers.filter(u => u.id !== userId);
  saveStoredUsers(updatedUsers);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const copyName = `usuarios_copia_${dateStr}_(${updatedUsers.length}).txt`;
  setActiveFileName(copyName);

  const token = await getAccessToken();
  if (token) {
    try {
      await uploadNewUserBaseCopy(updatedUsers, copyName);
    } catch (e) {
      console.error('Error creating Drive copy on user deletion:', e);
    }
  }

  return { users: updatedUsers, activeFile: copyName };
}

async function uploadNewUserBaseCopy(users: WaterUser[], fileName: string) {
  const token = await getAccessToken();
  if (!token) return;

  const txtContent = users.map(u => `${u.meterNumber}|${u.name}|${u.address || 'Sin Dirección'}`).join('\n');
  const metadata = { name: fileName, mimeType: 'text/plain' };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([txtContent], { type: 'text/plain' }));

  await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
}

function parseTxtToUsers(txt: string): WaterUser[] {
  const lines = txt.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.map((line, idx) => {
    const parts = line.split('|');
    if (parts.length >= 2) {
      return {
        id: `usr_${idx + 1}`,
        meterNumber: parts[0].trim(),
        name: parts[1].trim(),
        address: parts[2]?.trim() || 'Sector Rural'
      };
    }
    return {
      id: `usr_${idx + 1}`,
      meterNumber: `M-${String(idx + 1).padStart(3, '0')}`,
      name: line,
      address: 'Sector Rural'
    };
  });
}

const MONTH_HEADERS = [
  'N° Medidor', 'Nombre de Usuario',
  'Ene 2026', 'Feb 2026', 'Mar 2026', 'Abr 2026', 'May 2026', 'Jun 2026',
  'Jul 2026', 'Ago 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dic 2026'
];

function getColLetter(index: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[index] || 'Z';
}

function getMonthColIndex(monthYear: string): number {
  // monthYear can be "06/2026" or "Junio 2026"
  const m = parseInt(monthYear.slice(0, 2), 10);
  if (!isNaN(m) && m >= 1 && m <= 12) {
    return 1 + m; // Col 0 is Medidor, Col 1 is Nombre, Col 2 is Ene (m=1)
  }
  return 7; // Junio por defecto
}

// Google Sheets Excel monthly matrix record sync
export async function appendMeasurementToSheets(measurement: MonthlyMeasurement): Promise<boolean> {
  const list = getStoredMeasurements();
  saveStoredMeasurements([measurement, ...list]);

  const token = await getAccessToken();
  if (!token) return true; // Guardado localmente

  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name = 'Consumo_Mensual_Medidores' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let spreadsheetId = '';
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        spreadsheetId = data.files[0].id;
      }
    }

    const users = getStoredUsers();

    if (!spreadsheetId) {
      // Crear Excel con estructura matricial horizontal por mes y vertical por usuario
      const initialRowData = [
        { values: MONTH_HEADERS.map(h => ({ userEnteredValue: { stringValue: h } })) },
        ...users.map(u => ({
          values: [
            { userEnteredValue: { stringValue: u.meterNumber } },
            { userEnteredValue: { stringValue: u.name } },
            ...Array(12).fill({ userEnteredValue: { stringValue: '' } })
          ]
        }))
      ];

      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: { title: 'Consumo_Mensual_Medidores' },
          sheets: [{
            properties: { title: 'Registro_Mensual' },
            data: [{ startRow: 0, startColumn: 0, rowData: initialRowData }]
          }]
        })
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        spreadsheetId = createData.spreadsheetId;
      }
    }

    if (spreadsheetId) {
      // Obtener filas existentes para hallar la fila exacta del usuario
      const getRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Registro_Mensual!A1:B1000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let targetRowIndex = -1; // 1-indexed for Sheets

      if (getRes.ok) {
        const sheetData = await getRes.json();
        const rows = sheetData.values || [];
        for (let r = 1; r < rows.length; r++) {
          if (rows[r][0] === measurement.meterNumber || rows[r][1]?.includes(measurement.pinName)) {
            targetRowIndex = r + 1;
            break;
          }
        }

        // Si el usuario no estaba en la hoja, agregarlo al final
        if (targetRowIndex === -1) {
          targetRowIndex = rows.length + 1;
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Registro_Mensual!A${targetRowIndex}:B${targetRowIndex}?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ values: [[measurement.meterNumber || '-', measurement.pinName]] })
            }
          );
        }
      } else {
        targetRowIndex = 2;
      }

      // Calcular columna exacta del mes (Ej: C es Ene, H es Jun)
      const colIndex = getMonthColIndex(measurement.monthYear);
      const colLetter = getColLetter(colIndex);
      const cellRange = `Registro_Mensual!${colLetter}${targetRowIndex}`;

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${cellRange}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [[String(measurement.currentReading)]] })
        }
      );
    }
    return true;
  } catch (err) {
    console.error('Error updating Google Sheets matrix:', err);
    return true;
  }
}

