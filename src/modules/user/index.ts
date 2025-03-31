import { Router } from "express";
import UserController from "./users.controller";

const controller = new UserController()
const router = Router()

router.post('/users/signup', controller.signUp)
router.post('/users/signin', controller.signIn)
export default router;