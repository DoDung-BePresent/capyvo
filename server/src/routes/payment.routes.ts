import { Router } from 'express'
import { authenticate } from '@/middlewares/authenticate'
import { PaymentController } from '@/controllers/payment.controller'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = new PaymentController()

// Webhook from PayOS — no authentication
router.post('/webhook', asyncHandler(ctrl.handleWebhook.bind(ctrl)))

// Authenticated routes
router.use(authenticate)

router.post('/subscription-order', asyncHandler(ctrl.createSubscriptionOrder.bind(ctrl)))
router.get('/status', asyncHandler(ctrl.getPaymentStatus.bind(ctrl)))
router.get('/my', asyncHandler(ctrl.getMyPayments.bind(ctrl)))

export default router
