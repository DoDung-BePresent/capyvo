import { Router } from 'express'
import authRouter from './auth.routes'
import examSetRouter from './exam-set.routes'
import questionRouter from './question.routes'
import partInstructionRouter from './part-instruction.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/exam-sets', examSetRouter)
router.use('/questions', questionRouter)
router.use('/part-instructions', partInstructionRouter)

export default router
