import { Router } from 'express'
import authRouter from './auth.routes'
import examSetRouter from './exam-set.routes'
import questionRouter from './question.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/exam-sets', examSetRouter)
router.use('/questions', questionRouter)

export default router
