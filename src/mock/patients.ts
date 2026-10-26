import type { Patient } from '@/types'
import { pad } from './seed'

// Compact seed rows: [first, last, dob, sex, phone suffix, area, diagnosis, hospital index, status,
//   registeredAt, history[], surgeries[], meds[], allergies[], comorbidities[]]
type Row = [
  string, string, string, 'male' | 'female', string, string, string, number, 'active' | 'inactive',
  string, string[], string[], string[], string[], string[],
]

const rows: Row[] = [
  ['Amina', 'Kessy', '1974-03-14', 'female', '112 004', 'Masaki, Dar es Salaam', 'Right frontal low-grade glioma', 0, 'active', '2026-01-08', ['Migraine with aura (childhood)'], [], ['Levetiracetam 500 mg BD'], ['None known'], ['None']],
  ['Joseph', 'Mwangi', '1981-07-22', 'male', '118 220', 'Mikocheni, Dar es Salaam', 'L4/L5 disc herniation with left L5 radiculopathy', 1, 'active', '2026-02-02', ['Low back pain, 3 years'], [], ['Ibuprofen PRN', 'Pregabalin 75 mg BD'], ['Penicillin (rash)'], ['Obesity (BMI 31)']],
  ['Daniel', 'Okafor', '1997-11-05', 'male', '131 775', 'Kinondoni, Dar es Salaam', 'Traumatic brain injury — acute subdural haematoma', 2, 'active', '2026-03-19', [], [], ['None'], ['None known'], ['None']],
  ['Grace', 'Lumumba', '1965-09-30', 'female', '140 311', 'Arusha', 'Cervical spondylotic myelopathy C5/6', 3, 'active', '2026-01-21', ['Hypertension', 'Osteoarthritis knees'], ['Right knee arthroscopy 2019'], ['Amlodipine 10 mg OD'], ['Sulfa drugs'], ['Hypertension']],
  ['Samuel', 'Ndlovu', '1988-05-12', 'male', '152 908', 'Oyster Bay, Dar es Salaam', 'Unruptured right MCA bifurcation aneurysm', 0, 'active', '2026-04-03', ['Smoker, 10 pack-years'], [], ['Aspirin 75 mg OD'], ['None known'], ['Tobacco use']],
  ['Fatma', 'Rashid', '1959-12-01', 'female', '163 420', 'Upanga, Dar es Salaam', 'Normal pressure hydrocephalus', 1, 'active', '2026-08-14', ['Type 2 diabetes', 'Hypertension'], ['Cholecystectomy 2011'], ['Metformin 1 g BD', 'Losartan 50 mg OD'], ['None known'], ['Type 2 diabetes', 'Hypertension']],
  ['Peter', 'Mushi', '1972-02-18', 'male', '171 006', 'Moshi', 'Lumbar spinal stenosis L3–L5', 3, 'active', '2025-11-11', ['Chronic low back pain'], [], ['Paracetamol PRN'], ['None known'], ['None']],
  ['Neema', 'Mollel', '1990-08-09', 'female', '180 442', 'Mbezi Beach, Dar es Salaam', 'Vestibular schwannoma (left)', 0, 'active', '2025-12-02', ['Progressive left hearing loss'], [], ['None'], ['None known'], ['None']],
  ['Hassan', 'Juma', '1955-04-27', 'male', '192 831', 'Tabata, Dar es Salaam', 'Chronic subdural haematoma (bilateral)', 2, 'active', '2026-05-30', ['Atrial fibrillation'], [], ['Warfarin (held)', 'Bisoprolol 5 mg OD'], ['None known'], ['Atrial fibrillation', 'Anticoagulation']],
  ['Rehema', 'Chuma', '1983-10-16', 'female', '203 115', 'Mwanza', 'Thoracic meningioma T7', 4, 'active', '2026-02-24', [], [], ['None'], ['Latex'], ['None']],
  ['Emmanuel', 'Shayo', '1969-06-03', 'male', '214 790', 'Dodoma', 'Glioblastoma, left temporal', 0, 'active', '2026-03-05', ['Hypertension'], [], ['Dexamethasone 4 mg BD', 'Levetiracetam 500 mg BD'], ['None known'], ['Hypertension']],
  ['Zainab', 'Omari', '1995-01-25', 'female', '225 364', 'Kariakoo, Dar es Salaam', 'Pituitary macroadenoma', 1, 'active', '2026-06-12', ['Amenorrhoea 8 months'], [], ['Cabergoline 0.5 mg weekly'], ['None known'], ['None']],
  ['Baraka', 'Mwakyusa', '1978-09-07', 'male', '236 221', 'Mbeya', 'L5/S1 disc herniation', 5, 'active', '2026-04-18', [], ['Appendicectomy 2005'], ['Diclofenac PRN'], ['None known'], ['None']],
  ['Lillian', 'Mbwana', '1962-11-19', 'female', '247 557', 'Tegeta, Dar es Salaam', 'Cervical disc prolapse C6/7', 1, 'active', '2026-07-01', ['Hypothyroidism'], [], ['Levothyroxine 75 mcg OD'], ['Codeine (nausea)'], ['Hypothyroidism']],
  ['Michael', 'Kiwelu', '2001-03-30', 'male', '258 903', 'Ubungo, Dar es Salaam', 'Depressed skull fracture, right parietal', 2, 'active', '2026-09-02', [], [], ['None'], ['None known'], ['None']],
  ['Sophia', 'Massawe', '1947-05-14', 'female', '269 448', 'Arusha', 'Lumbar degenerative spondylolisthesis L4/L5', 3, 'active', '2026-01-30', ['Osteoporosis', 'Hypertension'], ['Total hip replacement 2017'], ['Alendronate weekly', 'Amlodipine 5 mg OD'], ['NSAIDs (GI bleed)'], ['Osteoporosis', 'Hypertension']],
  ['Ibrahim', 'Salum', '1985-08-21', 'male', '270 013', 'Zanzibar', 'Ruptured anterior communicating artery aneurysm', 0, 'active', '2026-06-27', ['Smoker'], [], ['Nimodipine 60 mg 4-hourly'], ['None known'], ['Tobacco use']],
  ['Agnes', 'Nyerere', '1976-12-08', 'female', '281 677', 'Kigamboni, Dar es Salaam', 'Convexity meningioma, right parietal', 1, 'active', '2026-02-10', [], [], ['Levetiracetam 500 mg BD'], ['None known'], ['None']],
  ['Francis', 'Tarimo', '1993-04-02', 'male', '292 332', 'Moshi', 'Thoracolumbar burst fracture L1', 3, 'active', '2026-07-19', [], [], ['None'], ['None known'], ['None']],
  ['Halima', 'Bakari', '1968-02-11', 'female', '303 806', 'Temeke, Dar es Salaam', 'Trigeminal neuralgia, right V2/V3', 1, 'active', '2026-05-06', ['Hypertension'], [], ['Carbamazepine 400 mg BD'], ['None known'], ['Hypertension']],
  ['George', 'Lyimo', '1980-10-23', 'male', '314 128', 'Tanga', 'Cerebellar haemangioblastoma', 0, 'active', '2026-04-29', [], [], ['None'], ['None known'], ['None']],
  ['Mariam', 'Hamisi', '1958-07-17', 'female', '325 594', 'Morogoro', 'Multilevel cervical stenosis C4–C6', 5, 'active', '2026-03-23', ['Type 2 diabetes'], [], ['Metformin 500 mg BD'], ['None known'], ['Type 2 diabetes']],
  ['Elias', 'Mbogo', '1991-01-09', 'male', '336 251', 'Mwanza', 'Spinal epidural abscess T10–T12', 4, 'active', '2026-08-22', ['IV drug use (remote)'], [], ['Ceftriaxone IV'], ['None known'], ['None']],
  ['Winnie', 'Kimaro', '1999-06-28', 'female', '347 719', 'Mikocheni, Dar es Salaam', 'Colloid cyst of the third ventricle', 0, 'active', '2026-09-15', ['Episodic headaches'], [], ['None'], ['None known'], ['None']],
  ['Said', 'Mohamed', '1964-03-05', 'male', '358 462', 'Zanzibar', 'Lumbar disc herniation L3/L4', 1, 'active', '2025-12-15', ['Hypertension', 'Gout'], [], ['Allopurinol 300 mg OD', 'Enalapril 10 mg OD'], ['None known'], ['Hypertension', 'Gout']],
  ['Rose', 'Mahenge', '1986-09-13', 'female', '369 937', 'Iringa', 'Arteriovenous malformation, left parietal (Spetzler–Martin II)', 0, 'active', '2026-05-20', ['Seizure disorder'], [], ['Lamotrigine 100 mg BD'], ['None known'], ['Epilepsy']],
  ['Juma', 'Ally', '1975-11-27', 'male', '370 305', 'Temeke, Dar es Salaam', 'Chiari I malformation with syringomyelia', 1, 'active', '2026-06-05', [], [], ['None'], ['None known'], ['None']],
  ['Esther', 'Mushi', '1952-08-04', 'female', '381 870', 'Moshi', 'Lumbar spinal stenosis L4/L5', 3, 'inactive', '2025-11-18', ['Hypertension', 'CKD stage 3'], [], ['Amlodipine 5 mg OD'], ['Contrast (mild reaction)'], ['Hypertension', 'Chronic kidney disease']],
  ['Abdul', 'Kheri', '1989-02-20', 'male', '392 148', 'Kinondoni, Dar es Salaam', 'Intracerebral haemorrhage, right basal ganglia', 2, 'active', '2026-07-08', ['Uncontrolled hypertension'], [], ['Nifedipine 30 mg OD'], ['None known'], ['Hypertension']],
  ['Lucy', 'Mwita', '1971-05-31', 'female', '403 612', 'Musoma', 'Cervical radiculopathy C5/6', 4, 'active', '2026-03-12', [], [], ['Gabapentin 300 mg TDS'], ['None known'], ['None']],
  ['Kelvin', 'Mrema', '2004-12-14', 'male', '414 987', 'Arusha', 'Posterior fossa medulloblastoma', 3, 'active', '2026-02-16', [], [], ['Dexamethasone 4 mg TDS'], ['None known'], ['None']],
  ['Beatrice', 'Sanga', '1960-10-02', 'female', '425 334', 'Njombe', 'Degenerative lumbar scoliosis', 5, 'active', '2026-04-08', ['Osteoporosis'], [], ['Calcium/Vitamin D'], ['None known'], ['Osteoporosis']],
  ['Yusuf', 'Mkapa', '1983-03-26', 'male', '436 701', 'Oyster Bay, Dar es Salaam', 'Extradural haematoma, left temporal', 2, 'active', '2026-09-28', [], [], ['None'], ['None known'], ['None']],
  ['Joyce', 'Komba', '1979-07-15', 'female', '447 059', 'Songea', 'Spinal metastasis T6 with cord compression', 0, 'active', '2026-08-01', ['Breast carcinoma (2023)'], ['Left mastectomy 2023'], ['Letrozole 2.5 mg OD', 'Dexamethasone 8 mg BD'], ['None known'], ['Malignancy']],
  ['Omari', 'Mwinyi', '1966-01-18', 'male', '458 425', 'Bagamoyo', 'Lumbar disc herniation L4/L5', 1, 'active', '2026-05-13', ['Type 2 diabetes'], [], ['Metformin 1 g BD'], ['None known'], ['Type 2 diabetes']],
  ['Diana', 'Ngowi', '1992-11-09', 'female', '469 882', 'Mbezi, Dar es Salaam', 'Epidermoid cyst, cerebellopontine angle', 0, 'active', '2026-06-20', [], [], ['None'], ['None known'], ['None']],
  ['Alex', 'Haule', '1957-06-22', 'male', '470 236', 'Iringa', 'Chronic subdural haematoma (left)', 2, 'active', '2026-09-10', ['Alcohol excess'], [], ['Thiamine'], ['None known'], ['Alcohol use disorder']],
  ['Veronica', 'Laizer', '1984-04-04', 'female', '481 599', 'Arusha', 'Cervical disc prolapse C5/6', 3, 'active', '2026-08-28', [], [], ['Naproxen PRN'], ['Aspirin (asthma)'], ['Asthma']],
  ['Charles', 'Mtui', '1948-09-11', 'male', '492 963', 'Kilimanjaro', 'Normal pressure hydrocephalus', 3, 'active', '2026-07-25', ['Benign prostatic hyperplasia'], ['TURP 2020'], ['Tamsulosin 0.4 mg OD'], ['None known'], ['None']],
  ['Hadija', 'Suleiman', '1977-02-28', 'female', '503 327', 'Zanzibar', 'Olfactory groove meningioma', 0, 'active', '2026-09-20', ['Anosmia 2 years'], [], ['None'], ['None known'], ['None']],
  ['Robert', 'Macha', '1996-08-08', 'male', '514 684', 'Moshi', 'Cervical spine fracture C6 (facet dislocation)', 3, 'active', '2026-10-05', [], [], ['None'], ['None known'], ['None']],
  ['Pendo', 'Mwakalinga', '1988-12-19', 'female', '525 041', 'Mbeya', 'Lumbar disc herniation L5/S1', 5, 'active', '2026-10-12', [], [], ['Ibuprofen PRN'], ['None known'], ['None']],
  ['Stephen', 'Kajembe', '1970-04-14', 'male', '536 408', 'Mwanza', 'Spinal cord ependymoma C3–C5', 4, 'active', '2026-10-18', [], [], ['None'], ['None known'], ['None']],
  ['Monica', 'Urassa', '1963-06-06', 'female', '547 765', 'Mikocheni, Dar es Salaam', 'Multilevel lumbar stenosis L2–L5', 1, 'inactive', '2025-11-05', ['Hypertension', 'Hyperlipidaemia'], [], ['Atorvastatin 20 mg ON'], ['None known'], ['Hypertension']],
  ['Isaac', 'Nnko', '1994-10-10', 'male', '558 122', 'Arusha', 'Cavernous malformation, right frontal', 3, 'active', '2026-10-20', ['Single seizure'], [], ['Levetiracetam 500 mg BD'], ['None known'], ['None']],
]

const hospitalIds = ['hosp-001', 'hosp-002', 'hosp-003', 'hosp-004', 'hosp-005', 'hosp-006']
const relationships = ['Spouse', 'Daughter', 'Son', 'Brother', 'Sister', 'Mother', 'Father']
const contactFirst = ['Asha', 'John', 'Mary', 'David', 'Salma', 'Paul', 'Ruth', 'Jackson', 'Anna', 'Moses']

export const patients: Patient[] = rows.map((r, i) => {
  const [firstName, lastName, dateOfBirth, sex, phoneSuffix, address, primaryDiagnosis, hospIdx, status, registeredAt, medicalHistory, previousSurgeries, medications, allergies, comorbidities] = r
  const n = i + 1
  return {
    id: `pt-${pad(n)}`,
    patientNumber: `NV-${pad(n, 4)}`,
    firstName,
    lastName,
    dateOfBirth,
    sex,
    phone: `+255 7${phoneSuffix.replace(' ', '')}${pad(n, 2)}`.slice(0, 16),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.invalid`,
    address,
    emergencyContact: {
      name: `${contactFirst[i % contactFirst.length]} ${lastName}`,
      relationship: relationships[i % relationships.length],
      phone: `+255 6${phoneSuffix.replace(' ', '')}${pad((n * 7) % 100, 2)}`.slice(0, 16),
    },
    medicalHistory,
    previousSurgeries,
    medications,
    allergies,
    comorbidities,
    hospitalId: hospitalIds[hospIdx],
    mrn: `MRN-${hospIdx + 1}${pad(n * 37 % 10000, 4)}`,
    status,
    registeredAt,
    primaryDiagnosis,
  }
})
