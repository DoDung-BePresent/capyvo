import { Router } from 'express'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { PricingCalculatorController } from '@/controllers/pricing-calculator.controller'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = new PricingCalculatorController()

router.use(authenticate, requireRole('ADMIN'))
router.post('/calculate', asyncHandler(ctrl.calculate.bind(ctrl)))

export default router
