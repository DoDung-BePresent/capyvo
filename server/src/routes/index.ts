import { Router } from 'express'
import authRouter from './auth.routes'
import examSetRouter from './exam-set.routes'
import questionRouter from './question.routes'
import partInstructionRouter from './part-instruction.routes'
import systemAudioRouter from './system-audio.routes'
import responseRouter from './response.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/exam-sets', examSetRouter)
router.use('/questions', questionRouter)
router.use('/part-instructions', partInstructionRouter)
router.use('/system-audio', systemAudioRouter)
router.use('/responses', responseRouter)

export default router
