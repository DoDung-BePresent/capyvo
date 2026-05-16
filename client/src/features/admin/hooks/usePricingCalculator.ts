import { useMutation } from '@tanstack/react-query'
import {
  pricingCalculatorService,
  type PricingInputs,
} from '../services/pricing-calculator.service'

export function usePricingCalculator() {
  return useMutation({
    mutationFn: (inputs: PricingInputs) => pricingCalculatorService.calculate(inputs),
  })
}
