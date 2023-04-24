import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import indexRouter from "./routes/indexRouter.js";

const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());
app.use(indexRouter);

app.listen(process.env.PORT, () => console.log(`Server on ${process.env.PORT}`));
