import { Router } from 'express'
import { authenticate } from '@/middlewares/authenticate'
import { PaymentController } from '@/controllers/payment.controller'

const router = Router()
const ctrl = new PaymentController()

// Webhook từ PayOS — KHÔNG cần authenticate (PayOS gọi trực tiếp)
// Đặt trước middleware authenticate
router.post('/webhook', (req, res, next) => ctrl.handleWebhook(req, res, next))

// Các route còn lại cần đăng nhập
router.use(authenticate)

router.post('/create', (req, res, next) => ctrl.createPaymentLink(req, res, next))
router.get('/status', (req, res, next) => ctrl.getPaymentStatus(req, res, next))
router.get('/my', (req, res, next) => ctrl.getMyPayments(req, res, next))

export default router
