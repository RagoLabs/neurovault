/**
 * Central registry of all medical imagery used in the application.
 * Every entry is openly licensed; see public/images/ATTRIBUTION.md.
 * Radiological images are SAMPLE EDUCATIONAL IMAGES and are never
 * presented as the scans of the fictional patients.
 */
const BASE = import.meta.env.BASE_URL

export interface ImageAsset {
  key: string
  src: string
  alt: string
  caption: string
  credit: string
  license: string
  kind: 'imaging' | 'illustration'
  sample: boolean
}

export const imageAssets = {
  mriBrainAxial: {
    key: 'mriBrainAxial',
    src: `${BASE}images/imaging/mri-brain-axial.jpg`,
    alt: 'Sample axial T1 contrast-enhanced MRI of the brain showing an enhancing extra-axial mass',
    caption: 'Sample axial T1 post-contrast brain MRI (educational image)',
    credit: 'Tdvorak, Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    kind: 'imaging',
    sample: true,
  },
  ctBrainAxial: {
    key: 'ctBrainAxial',
    src: `${BASE}images/imaging/ct-brain-axial.png`,
    alt: 'Sample axial CT of a normal brain',
    caption: 'Sample axial CT brain (educational image)',
    credit: 'Mikael Häggström, M.D., Wikimedia Commons',
    license: 'CC0 1.0',
    kind: 'imaging',
    sample: true,
  },
  mriLumbarSagittal: {
    key: 'mriLumbarSagittal',
    src: `${BASE}images/imaging/mri-lumbar-sagittal.jpg`,
    alt: 'Sample sagittal T2 MRI of the lumbar spine',
    caption: 'Sample sagittal T2 lumbar spine MRI (educational image)',
    credit: 'Stillwaterising, Wikimedia Commons',
    license: 'CC0 1.0',
    kind: 'imaging',
    sample: true,
  },
  mriCervicalSagittal: {
    key: 'mriCervicalSagittal',
    src: `${BASE}images/imaging/mri-cervical-sagittal.jpg`,
    alt: 'Sample sagittal MRI of the cervical spine showing a disc herniation',
    caption: 'Sample sagittal cervical spine MRI (educational image)',
    credit: 'Stillwaterising, Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    kind: 'imaging',
    sample: true,
  },
  ctSpine: {
    key: 'ctSpine',
    src: `${BASE}images/imaging/ct-cervical-sagittal.jpg`,
    alt: 'Sample sagittal CT of the cervical vertebrae',
    caption: 'Sample sagittal cervical spine CT (educational image)',
    credit: 'Mikael Häggström, Wikimedia Commons',
    license: 'CC0 1.0',
    kind: 'imaging',
    sample: true,
  },
  angiography: {
    key: 'angiography',
    src: `${BASE}images/imaging/angiography.jpg`,
    alt: 'Sample lateral cerebral angiogram',
    caption: 'Sample lateral cerebral angiogram (educational image)',
    credit: 'Glitzy queen00, Wikimedia Commons',
    license: 'Public domain',
    kind: 'imaging',
    sample: true,
  },
  xraySpine: {
    key: 'xraySpine',
    src: `${BASE}images/imaging/xray-placeholder.svg`,
    alt: 'Illustrative radiograph placeholder',
    caption: 'Illustrative radiograph placeholder (no sample radiograph bundled)',
    credit: 'NeuroVault',
    license: 'MIT',
    kind: 'imaging',
    sample: true,
  },
  brainLobes: {
    key: 'brainLobes',
    src: `${BASE}images/illustrations/brain-lobes.jpg`,
    alt: 'Labelled illustration of the lobes of the brain',
    caption: 'Lobes of the brain',
    credit: 'Blausen.com staff (2014), Medical gallery of Blausen Medical 2014, WikiJournal of Medicine',
    license: 'CC BY 3.0',
    kind: 'illustration',
    sample: false,
  },
  brainLateral: {
    key: 'brainLateral',
    src: `${BASE}images/illustrations/brain-lateral.jpg`,
    alt: 'Lateral view illustration of the human brain',
    caption: 'Lateral view of the brain',
    credit: 'Blausen.com staff (2014), Medical gallery of Blausen Medical 2014, WikiJournal of Medicine',
    license: 'CC BY 3.0',
    kind: 'illustration',
    sample: false,
  },
  neuralMotif: {
    key: 'neuralMotif',
    src: `${BASE}images/illustrations/neural-motif.svg`,
    alt: 'Abstract neural network motif',
    caption: 'Neural network motif',
    credit: 'NeuroVault',
    license: 'MIT',
    kind: 'illustration',
    sample: false,
  },
  spineLateral: {
    key: 'spineLateral',
    src: `${BASE}images/anatomy/spine-lateral.svg`,
    alt: 'Schematic lateral illustration of the vertebral column with regions labelled',
    caption: 'Vertebral column regions (schematic)',
    credit: 'NeuroVault',
    license: 'MIT',
    kind: 'illustration',
    sample: false,
  },
} as const satisfies Record<string, ImageAsset>

export type ImageKey = keyof typeof imageAssets

export function getImage(key: string | undefined): ImageAsset | undefined {
  if (!key) return undefined
  return (imageAssets as Record<string, ImageAsset>)[key]
}

export const SAMPLE_IMAGE_NOTICE = 'Sample educational image — not the scan of this fictional patient.'
