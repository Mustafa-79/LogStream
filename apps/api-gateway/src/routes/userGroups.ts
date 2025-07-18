import { Router } from 'express'
import { authenticateJWT, requireAdmin } from '../middlewares/auth'
import * as userGroupsController from '../controllers/userGroups.controller'
import validate from '../middlewares/validate'
import { userGroupValidation } from '../validations/userGroups.validation'

const router = Router()

// Apply authentication to all user group routes
router.use(authenticateJWT);

router.get('/', requireAdmin, validate(userGroupValidation.getUserGroups), userGroupsController.getUserGroups)

router.post('/', requireAdmin, validate(userGroupValidation.createUserGroup), userGroupsController.createUserGroup)

router.put('/:id', requireAdmin, validate(userGroupValidation.updateUserGroup), userGroupsController.updateUserGroup)

router.delete('/:id', requireAdmin, validate(userGroupValidation.deleteUserGroup), userGroupsController.deleteUserGroup)

router.post('/:id/restore', requireAdmin, validate(userGroupValidation.restoreUserGroup), userGroupsController.restoreUserGroup)

router.post('/:id/add-member', requireAdmin, validate(userGroupValidation.addUserToGroup), userGroupsController.addUserToGroup)

router.post('/:id/remove-member', requireAdmin, validate(userGroupValidation.removeUserFromGroup), userGroupsController.removeUserFromGroup)

export default router




