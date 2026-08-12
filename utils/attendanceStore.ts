export interface AttendanceRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  status: "Present" | "Working" | "Late" | "Half Day" | "Absent";
}

const STORAGE_KEY = "oms_attendance_master_ledger_v1";

const defaultAttendanceList: AttendanceRecord[] = [
  {
    id: "ATT-1001",
    employeeId: "EMP001",
    name: "Roushan Verma",
    department: "Executive Management",
    date: "2026-08-08",
    checkIn: "09:05 AM",
    checkOut: "06:15 PM",
    hours: "9h 10m",
    status: "Present",
  },
  {
    id: "ATT-1002",
    employeeId: "EMP003",
    name: "Priya Sharma",
    department: "Human Resources",
    date: "2026-08-08",
    checkIn: "09:15 AM",
    checkOut: "05:45 PM",
    hours: "8h 30m",
    status: "Present",
  },
  {
    id: "ATT-1003",
    employeeId: "EMP014",
    name: "Aditya Raj",
    department: "Development & Engineering",
    date: "2026-08-08",
    checkIn: "09:30 AM",
    checkOut: "--",
    hours: "7h 00m",
    status: "Working",
  },
];

export function getStoredAttendance(): AttendanceRecord[] {
  if (typeof window === "undefined") return defaultAttendanceList;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return defaultAttendanceList;
}

export function saveStoredAttendance(records: AttendanceRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {}
}

export function addStoredAttendanceRecord(newRec: AttendanceRecord): AttendanceRecord[] {
  const current = getStoredAttendance();
  const updated = [newRec, ...current];
  saveStoredAttendance(updated);
  return updated;
}
