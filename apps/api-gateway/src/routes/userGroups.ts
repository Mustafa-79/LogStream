//// filepath: /home/mustafaabbas/Work/Probation/LogStream/LogStream/apps/api-gateway/src/routes/userGroups.ts
import { Router } from 'express'
import * as userGroupsController from '../controllers/userGroups.controller'
import validate from '../middlewares/validate'
import { userGroupValidation } from '../validations/userGroups.validation'




const router = Router()

router.get('/', userGroupsController.getUserGroups)

router.post('/', validate(userGroupValidation.createUserGroup), userGroupsController.createUserGroup)

router.put('/:id', validate(userGroupValidation.updateUserGroup), userGroupsController.updateUserGroup)

router.delete('/:id', validate(userGroupValidation.deleteUserGroup), userGroupsController.deleteUserGroup)

// TODO: add a restore delete route
router.post('/:id/restore', validate(userGroupValidation.restoreUserGroup), userGroupsController.restoreUserGroup)

export default router




