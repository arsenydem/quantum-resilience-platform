import type { SecurityControl } from '../types'

export interface ScoreWeights {
  nodes: number
  edges: number
  controls: number
  categories: number
}

export interface ControlAdjustments {
  bonuses: Partial<Record<keyof SecurityControl, number>>
  penalties: Partial<Record<keyof SecurityControl, number>>
}

export interface PenaltyConfig {
  lowNodeWeightStep: number
  lowNodeWeightLimit: number
  missingCriticalCategory: number
}

export interface RiskConfig {
  weights: ScoreWeights
  controlAdjustments: ControlAdjustments
  penalties: PenaltyConfig & {
    missingControls: Partial<Record<keyof SecurityControl, number>>
  }
}

export const riskConfig: RiskConfig = {
  weights: {
    nodes: 0.45,
    edges: 0.15,
    controls: 0.15,
    categories: 0.25,
  },
  controlAdjustments: {
    bonuses: {
      antivirus: 2,
      firewall: 2,
      siem: 3,
      backup: 3,
      edr: 2,
      twoFactor: 3,
    },
    penalties: {},
  },
  penalties: {
    lowNodeWeightStep: 2,
    lowNodeWeightLimit: 20,
    missingCriticalCategory: 5,
    missingControls: {
      antivirus: 4,
      firewall: 3,
      siem: 4,
      backup: 4,
      edr: 3,
      twoFactor: 3,
    },
  },
}
