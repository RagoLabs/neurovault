/**
 * Centralised surgeon identity. Edit this file to re-brand the application
 * for a different clinician without touching individual components.
 */
export const surgeon = {
  title: 'Dr.',
  firstName: 'Max',
  lastName: 'Gamma',
  fullName: 'Dr. Max Gamma',
  shortName: 'Dr. Gamma',
  initials: 'MG',
  credentials: 'MD, FCS (Neurosurgery)',
  specialty: 'Consultant Neurosurgeon — Brain & Spine',
  subspecialties: ['Neuro-oncology', 'Complex spine', 'Neurovascular', 'Neurotrauma'],
  registrationNumber: 'MCT-NS-48213',
  email: 'max.gamma@neurovault.demo',
  phone: '+255 700 000 100',
  practiceName: 'Gamma Neurosurgery Practice',
  primaryHospitalId: 'hosp-001',
  biography:
    'Dr. Max Gamma is a consultant neurosurgeon with a combined cranial and spinal practice. His clinical interests include intrinsic brain tumours, degenerative and traumatic spine, and cerebrovascular surgery.',
  signatureLine: 'Dr. Max Gamma, Consultant Neurosurgeon',
} as const

export const brand = {
  name: 'NeuroVault',
  tagline: 'Personal Neurosurgery Clinical Management',
  version: '0.9.0-demo',
  demoLabel: 'Demo Mode — Fictional Clinical Data',
} as const
