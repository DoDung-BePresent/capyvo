import { Router } from 'express'
import { SubscriptionController } from '../controllers/subscription.controller'
import { authenticate } from '@/middlewares/authenticate'

const router = Router()
const ctrl = SubscriptionController

// Public routes
router.get('/plans', (req, res, next) => ctrl.getPlans(req, res, next))

// Protected routes (require authentication)
router.use(authenticate)

router.get('/current', (req, res, next) => ctrl.getCurrentSubscription(req, res, next))
router.get('/history', (req, res, next) => ctrl.getHistory(req, res, next))
router.post('/create', (req, res, next) => ctrl.createSubscription(req, res, next))
router.post('/cancel', (req, res, next) => ctrl.cancelSubscription(req, res, next))

// Internal/Cron route (should be protected with API key in production)
router.post('/check-expired', (req, res, next) => ctrl.checkExpired(req, res, next))

export default router
