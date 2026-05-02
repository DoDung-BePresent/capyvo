import { Router } from 'express'
import authRouter from './auth.routes'
import examSetRouter from './exam-set.routes'
import questionRouter from './question.routes'
import partInstructionRouter from './part-instruction.routes'
import systemAudioRouter from './system-audio.routes'
import responseRouter from './response.routes'
import sessionRouter from './session.routes'
import maintenanceRouter from './maintenance.routes'
import systemStatsRouter from './system-stats.routes'
import paymentRouter from './payment.routes'
import adminDashboardRouter from './admin-dashboard.routes'
import subscriptionRouter from './subscription.routes'

const router = Router()

router.use('/maintenance', maintenanceRouter)
router.use('/auth', authRouter)
router.use('/exam-sets', examSetRouter)
router.use('/questions', questionRouter)
router.use('/part-instructions', partInstructionRouter)
router.use('/system-audio', systemAudioRouter)
router.use('/responses', responseRouter)
router.use('/sessions', sessionRouter)
router.use('/system-stats', systemStatsRouter)
router.use('/payments', paymentRouter)
router.use('/admin/dashboard', adminDashboardRouter)
router.use('/subscription', subscriptionRouter)

export default router
