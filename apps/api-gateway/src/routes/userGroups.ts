//// filepath: /home/mustafaabbas/Work/Probation/LogStream/LogStream/apps/api-gateway/src/routes/userGroups.ts
import { Router } from 'express'
import { authenticateJWT, requireAdmin } from '../middlewares/auth'
import * as userGroupsController from '../controllers/userGroups.controller'
import validate from '../middlewares/validate'
import { userGroupValidation } from '../validations/userGroups.validation'

const router = Router()

// Apply authentication to all user group routes
router.use(authenticateJWT);

router.get('/', requireAdmin, userGroupsController.getUserGroups)

router.post('/', requireAdmin, validate(userGroupValidation.createUserGroup), userGroupsController.createUserGroup)

router.put('/:id', requireAdmin, validate(userGroupValidation.updateUserGroup), userGroupsController.updateUserGroup)

router.delete('/:id', requireAdmin, validate(userGroupValidation.deleteUserGroup), userGroupsController.deleteUserGroup)

router.post('/:id/restore', validate(userGroupValidation.restoreUserGroup), userGroupsController.restoreUserGroup)

export default router




