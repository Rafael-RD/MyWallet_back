import { Router } from "express";
import userRouter from "./userRouter.js";
import transactionRouter from "./transactionRouter.js";

const indexRouter=Router();
indexRouter.use(userRouter);
indexRouter.use(transactionRouter);
export default indexRouter;