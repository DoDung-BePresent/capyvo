import { Router } from 'express'
import examSetRouter from './exam-set.routes'

const router = Router()

router.use('/exam-sets', examSetRouter)

export default router
