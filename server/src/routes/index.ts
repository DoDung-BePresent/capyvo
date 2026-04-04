import { Router } from 'express'
import authRouter from './auth.routes'
import examSetRouter from './exam-set.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/exam-sets', examSetRouter)

export default router
