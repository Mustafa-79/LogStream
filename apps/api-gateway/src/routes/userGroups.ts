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

router.post('/add-member', validate(userGroupValidation.addRemoveMember), userGroupsController.addMember)

router.post('/remove-member', validate(userGroupValidation.addRemoveMember), userGroupsController.removeMember)

router.post('/add-application', validate(userGroupValidation.addRemoveApplication), userGroupsController.addApplication)

router.post('/remove-application', validate(userGroupValidation.addRemoveApplication), userGroupsController.removeApplication)

export default router




