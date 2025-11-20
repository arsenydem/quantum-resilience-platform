import type { SecurityControl } from '../types'

export interface ScoreWeights {
  nodes: number
  edges: number
  controls: number
  categories: number
}

export interface ControlAdjustments {
  // бонусы/штрафы применяются к конкретным полям SecurityControl
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
    // немножко усиливаем вклад управлений безопасностью
    nodes: 0.4,
    edges: 0.15,
    controls: 0.2,
    categories: 0.25,
  },
  controlAdjustments: {
    bonuses: {
      // базовые технические контроли
      antivirus: 2,
      firewall: 2,
      siem: 3,
      backup: 3,
      edr: 2,
      twoFactor: 3,

      // бонус за ФСТЭК-сертификацию решения
      // (для узлов/контролей, у которых fstekCertified === true)
      fstekCertified: 2,
    },
    penalties: {
      // при желании можно добавить, например, штраф за legacy-решения
      // legacyCrypto: 2,
    },
  },
  penalties: {
    // чем больше слабых узлов (низкий вес), тем сильнее штраф
    lowNodeWeightStep: 2,
    lowNodeWeightLimit: 20,

    // штраф за отсутствие критической категории (Wi-Fi, диск.шифрование, файрволы и т.п.)
    missingCriticalCategory: 5,

    // штрафы за отсутствие конкретных контролей
    missingControls: {
      antivirus: 4,
      firewall: 4, // файрволы делаем чуть более критичными
      siem: 4,
      backup: 4,
      edr: 3,
      twoFactor: 3,
      // fstekCertified здесь не нужен — это именно бонус, а не обязательное требование
    },
  },
}
