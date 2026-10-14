import { GovernmentRole, GovernmentUser } from '../types';
import { HeartPulse, Flame, Shield, Building2, Radio } from 'lucide-react';

export interface SampleLoginAccount {
  role: GovernmentRole;
  title: string;
  agency: string;
  username: string;
  passwordHint: string;
  name: string;
  unitId?: string;
  hospitalId?: string;
  clearanceLevel: string;
  colorTheme: string;
  borderTheme: string;
  bgTheme: string;
  description: string;
}

export const SAMPLE_LOGINS: SampleLoginAccount[] = [
  {
    role: 'AMBULANCE_DRIVER',
    title: 'Emergency Medical Technician / Driver',
    agency: 'Metropolitan Paramedic & Trauma Services',
    username: 'AMB-104',
    passwordHint: 'medic123',
    name: 'Officer Dan Morales',
    unitId: 'AMB-01',
    hospitalId: 'hosp-01',
    clearanceLevel: 'LEVEL_1_PARAMEDIC',
    colorTheme: 'text-rose-400',
    borderTheme: 'border-rose-500/40 hover:border-rose-400',
    bgTheme: 'bg-rose-500/10 hover:bg-rose-500/20',
    description: 'Driver In-Cab Console, < 1.0 km Signal Preemption, Trauma Bay Sync'
  },
  {
    role: 'FIRE_OFFICER',
    title: 'Battalion Rescue Chief',
    agency: 'Metro Fire Department — HAZMAT Division',
    username: 'FIRE-01',
    passwordHint: 'fire911',
    name: 'Chief Sarah Jenkins',
    unitId: 'FIRE-01',
    clearanceLevel: 'LEVEL_3_COMMAND',
    colorTheme: 'text-amber-400',
    borderTheme: 'border-amber-500/40 hover:border-amber-400',
    bgTheme: 'bg-amber-500/10 hover:bg-amber-500/20',
    description: 'HAZMAT containment, thermal drone recon, multi-alarm fire deployment'
  },
  {
    role: 'POLICE_OFFICER',
    title: 'Transit & Highway Patrol Supervisor',
    agency: 'Urban Law Enforcement — Precinct 4',
    username: 'POL-02',
    passwordHint: 'police77',
    name: 'Sgt. Alex Thorne',
    unitId: 'POL-02',
    clearanceLevel: 'LEVEL_2_TACTICAL',
    colorTheme: 'text-blue-400',
    borderTheme: 'border-blue-500/40 hover:border-blue-400',
    bgTheme: 'bg-blue-500/10 hover:bg-blue-500/20',
    description: 'Arterial roadblock lockouts, perimeter evacuation control'
  },
  {
    role: 'HOSPITAL_TRAUMA_CHIEF',
    title: 'Emergency Trauma & Surgical Directorate',
    agency: 'Zuckerberg Metro General & Trauma Center',
    username: 'HOSP-01',
    passwordHint: 'traumaER',
    name: 'Dr. Elena Rostova, MD',
    hospitalId: 'hosp-01',
    clearanceLevel: 'LEVEL_3_COMMAND',
    colorTheme: 'text-emerald-400',
    borderTheme: 'border-emerald-500/40 hover:border-emerald-400',
    bgTheme: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    description: 'Trauma Resuscitation Bay clearance, on-call surgical team standby'
  },
  {
    role: 'CITY_DISPATCH_OPERATOR',
    title: 'Emergency Operations Command Director',
    agency: 'Department of Municipal Emergency Management',
    username: 'DISP-01',
    passwordHint: 'admin911',
    name: 'Director Marcus Sterling',
    clearanceLevel: 'LEVEL_4_CHIEF',
    colorTheme: 'text-cyan-400',
    borderTheme: 'border-cyan-500/40 hover:border-cyan-400',
    bgTheme: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    description: 'Full municipal dispatch matrix, multilingual alert broadcasting'
  }
];

export const createGovUserFromSample = (sample: SampleLoginAccount): GovernmentUser => ({
  id: `usr-${sample.username.toLowerCase()}`,
  badgeNumber: sample.username,
  fullName: sample.name,
  role: sample.role,
  roleTitle: sample.title,
  agencyName: sample.agency,
  callsign: sample.unitId,
  assignedUnitId: sample.unitId,
  assignedHospitalId: sample.hospitalId,
  clearanceLevel: sample.clearanceLevel,
  loggedAt: new Date().toISOString()
});
