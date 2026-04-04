import { Router } from 'express'
import { ExamSetController } from '@/controllers/exam-set.controller'

const router = Router()
const controller = new ExamSetController()

router.get('/', controller.getAll)
router.get('/:id', controller.getById)
router.post('/', controller.create)
router.put('/:id', controller.update)
router.delete('/:id', controller.remove)

export default router
