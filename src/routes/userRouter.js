import { Router } from "express";
import { logIn, signUp } from "../controllers/userController.js";

const userRouter=Router();

userRouter.post('/sign-up', signUp);
userRouter.post('/login', logIn);

export default userRouter;