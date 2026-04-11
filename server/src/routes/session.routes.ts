import { Router } from 'express'
import { authenticate } from '@/middlewares/authenticate'
import { SessionController } from '@/controllers/session.controller'

const router = Router()
const ctrl = new SessionController()

router.post('/', authenticate, (req, res, next) => ctrl.create(req, res, next))
router.get('/my/completed-set-ids', authenticate, (req, res, next) =>
  ctrl.completedSetIds(req, res, next),
)
router.get('/my', authenticate, (req, res, next) => ctrl.myBySet(req, res, next))
router.get('/stats/:examSetId', authenticate, (req, res, next) => ctrl.setStats(req, res, next))
router.patch('/:id/complete', authenticate, (req, res, next) => ctrl.complete(req, res, next))
router.get('/:id', authenticate, (req, res, next) => ctrl.detail(req, res, next))

export default router
