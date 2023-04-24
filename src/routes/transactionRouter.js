import { Router } from "express";
import { deleteTransaction, getTransactions, putTransaction, receive, send } from "../controllers/transactionController.js";

const transactionRouter=Router();

transactionRouter.post('/transactions/send', send);
transactionRouter.post('/transactions/receive', receive);
transactionRouter.get('/transactions', getTransactions);
transactionRouter.delete('/transactions', deleteTransaction);
transactionRouter.put('/transactions', putTransaction);

export default transactionRouter;