//// filepath: /home/mustafaabbas/Work/Probation/LogStream/LogStream/apps/api-gateway/src/routes/userGroups.ts
import { Router } from 'express'
import * as userGroupsController from '../controllers/userGroups.controller'
import validate from '../middlewares/validate'
import {
  createUserGroupSchema,
  updateUserGroupSchema,
  addRemoveMemberSchema,
  addRemoveApplicationSchema,
} from '../validations/userGroups.validation'

const router = Router()

router.get('/', userGroupsController.getUserGroups)

router.post('/', validate({ body: createUserGroupSchema }), userGroupsController.createUserGroup)

router.put('/:id', validate({ body: updateUserGroupSchema }), userGroupsController.updateUserGroup)

router.delete('/:id', userGroupsController.deleteUserGroup)

router.post('/add-member', validate({ body: addRemoveMemberSchema }), userGroupsController.addMember)

router.post('/remove-member', validate({ body: addRemoveMemberSchema }), userGroupsController.removeMember)

router.post('/add-application', validate({ body: addRemoveApplicationSchema }), userGroupsController.addApplication)

router.post('/remove-application', validate({ body: addRemoveApplicationSchema }), userGroupsController.removeApplication)

export default router




