import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validateComponentQuery, validateObjectId } from '../middleware/validateComponentQuery.js'
import { createComponentController } from '../controllers/componentController.js'

export function createComponentRoutes(dependencies) {
  const router = Router()
  const controller = createComponentController(dependencies)
  router.get('/', validateComponentQuery, asyncHandler(controller.list))
  router.get('/:id', validateObjectId, asyncHandler(controller.getById))
  return router
}
