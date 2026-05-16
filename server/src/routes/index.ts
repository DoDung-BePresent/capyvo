import { Router } from 'express'
import authRouter from './auth.routes'
import examSetRouter from './exam-set.routes'
import questionRouter from './question.routes'
import topicRouter from './topic.routes'
import responseRouter from './response.routes'
import sessionRouter from './session.routes'
import maintenanceRouter from './maintenance.routes'
import systemStatsRouter from './system-stats.routes'
import paymentRouter from './payment.routes'
import adminDashboardRouter from './admin-dashboard.routes'
import openaiUsageRouter from './openai-usage.routes'
import pricingCalculatorRouter from './pricing-calculator.routes'
import abuseDetectionRouter from './abuse-detection.routes'
import subscriptionRouter from './subscription.routes'
import activityRouter from './activity.routes'
import shareRouter from './share.routes'

const router = Router()

router.use('/maintenance', maintenanceRouter)
router.use('/auth', authRouter)
router.use('/exam-sets', examSetRouter)
router.use('/questions', questionRouter)
router.use('/topics', topicRouter)
router.use('/responses', responseRouter)
router.use('/sessions', sessionRouter)
router.use('/system-stats', systemStatsRouter)
router.use('/payments', paymentRouter)
router.use('/admin/dashboard', adminDashboardRouter)
router.use('/admin/openai-usage', openaiUsageRouter)
router.use('/admin/pricing-calculator', pricingCalculatorRouter)
router.use('/admin/abuse-detection', abuseDetectionRouter)
router.use('/subscription', subscriptionRouter)
router.use('/activity', activityRouter)
router.use('/shares', shareRouter)

export default router
