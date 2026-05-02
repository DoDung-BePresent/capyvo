import { Router } from 'express'
import { authenticate } from '@/middlewares/authenticate'
import { PaymentController } from '@/controllers/payment.controller'

const router = Router()
const ctrl = new PaymentController()

// Webhook từ PayOS — không cần authenticate
router.post('/webhook', (req, res, next) => ctrl.handleWebhook(req, res, next))

// Public: danh sách gói token (DEPRECATED)
router.get('/token-packages', (req, res) => ctrl.getTokenPackages(req, res))

// Các route cần đăng nhập
router.use(authenticate)

router.post('/create-token', (req, res, next) => ctrl.createTokenOrder(req, res, next)) // DEPRECATED
router.post('/create-subscription', (req, res, next) =>
  ctrl.createSubscriptionOrder(req, res, next),
)
router.get('/status', (req, res, next) => ctrl.getPaymentStatus(req, res, next))
router.get('/my', (req, res, next) => ctrl.getMyPayments(req, res, next))

export default router
