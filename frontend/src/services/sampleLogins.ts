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
    title: '108 Advanced Life Support (ALS) Ambulance Pilot',
    agency: '108 Emergency Medical Relief Services — GVK EMRI Karnataka',
    username: 'PILOT-108',
    passwordHint: 'medic108',
    name: 'Pilot Rajesh Sharma',
    unitId: 'unit-ems-101',
    hospitalId: 'hosp-01',
    clearanceLevel: 'LEVEL_1_EMS_PILOT',
    colorTheme: 'text-rose-400',
    borderTheme: 'border-rose-500/40 hover:border-rose-400',
    bgTheme: 'bg-rose-500/10 hover:bg-rose-500/20',
    description: 'In-Cab Telemetry, < 1.0 km Signal Preemption, Apollo Trauma Bay Sync'
  },
  {
    role: 'FIRE_OFFICER',
    title: 'Karnataka Fire Force & SDRF Battalion Commander',
    agency: 'Karnataka State Fire and Emergency Services & SDRF',
    username: 'FIRE-101',
    passwordHint: 'fire101',
    name: 'Commander Vikram Rao',
    unitId: 'unit-fire-201',
    clearanceLevel: 'LEVEL_3_COMMAND',
    colorTheme: 'text-amber-400',
    borderTheme: 'border-amber-500/40 hover:border-amber-400',
    bgTheme: 'bg-amber-500/10 hover:bg-amber-500/20',
    description: 'SDRF chemical foam suppression, ISRO aerial thermal drone recon'
  },
  {
    role: 'POLICE_OFFICER',
    title: 'Bengaluru Traffic Police (BTP) Flying Squad Inspector',
    agency: 'Bengaluru City Police — Traffic Flying Squad 100',
    username: 'POLICE-100',
    passwordHint: 'police100',
    name: 'Inspector Suresh Patil',
    unitId: 'unit-tac-501',
    clearanceLevel: 'LEVEL_2_TACTICAL',
    colorTheme: 'text-blue-400',
    borderTheme: 'border-blue-500/40 hover:border-blue-400',
    bgTheme: 'bg-blue-500/10 hover:bg-blue-500/20',
    description: 'Silk Board & ORR Green Corridor road clearance, flyover perimeter lockouts'
  },
  {
    role: 'HOSPITAL_TRAUMA_CHIEF',
    title: 'Chief of Trauma & Emergency Critical Care',
    agency: 'Apollo Multi-Speciality Trauma & Emergency Center',
    username: 'APOLLO-ER',
    passwordHint: 'apolloER',
    name: 'Dr. Priya Venkat, MS (Trauma)',
    hospitalId: 'hosp-01',
    clearanceLevel: 'LEVEL_3_SURGICAL',
    colorTheme: 'text-emerald-400',
    borderTheme: 'border-emerald-500/40 hover:border-emerald-400',
    bgTheme: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    description: 'Trauma Resuscitation Bay clearance, direct on-call surgical team standby'
  },
  {
    role: 'CITY_DISPATCH_OPERATOR',
    title: '112 Unified Emergency Response Center Director',
    agency: 'Karnataka State Emergency Operation Centre (112 ERSS)',
    username: 'DISP-112',
    passwordHint: 'admin112',
    name: 'Director Amit Sen',
    clearanceLevel: 'LEVEL_4_CHIEF',
    colorTheme: 'text-cyan-400',
    borderTheme: 'border-cyan-500/40 hover:border-cyan-400',
    bgTheme: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    description: 'Statewide 112 dispatch matrix, multilingual regional alert broadcasting'
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
