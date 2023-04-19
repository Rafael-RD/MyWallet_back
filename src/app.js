import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import Joi from "joi";
import { stripHtml } from "string-strip-html";
import { v4 as uuidv4 } from "uuid";
import bcrypt from 'bcrypt';

const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());

const mongoClint = new MongoClient(process.env.DATABASE_URL);

try {
    await mongoClint.connect();
    console.log('MongoDB Connected');
} catch (err) {
    console.log(err);
}

const db = mongoClint.db();

function applyStripHtml(target) {
    if (typeof (target) === 'string') return stripHtml(target).result;
    else return target;
}


const joiSchemes = {
    postUser: Joi.object({
        name: Joi.string().min(3).max(50).required().custom(applyStripHtml).trim(),
        email: Joi.string().email().required().custom(applyStripHtml).trim(),
        password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required().trim()
    })
}

app.post('/sign-up', async (req, res) => {
    const { name, email, password } = req.body;
    const validation = joiSchemes.postUser.validate({ name, email, password }, { abortEarly: false });
    if (validation.error) return res.status(422).send(validation.error.details.map(e => e.message.replaceAll('\"', '')));

    const hash = bcrypt.hashSync(validation.value.password, 10);

    try {
        const search = await db.collection('users').findOne({ email: validation.value.email });
        if (search) return res.sendStatus(409);
        await db.collection('users').insertOne({ name: validation.value.name, email: validation.value.email, password: hash });
        return res.sendStatus(201);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
});

app.post('/login', async (req, res) => {
    const { name, email, password } = req.body;

    const validation = joiSchemes.postUser.validate({ name, email, password }, { abortEarly: false });
    if (validation.error) return res.status(422).send(validation.error.details.map(e => e.message.replaceAll('\"', '')));

    try {
        const searchUser = await db.collection('users').findOne({ email: validation.value.email });
        if (!searchUser) return res.sendStatus(404);
        if (bcrypt.compareSync(validation.value.password, searchUser.password) === false) return res.sendStatus(401);
        const token = uuidv4();
        const searchToken = await db.collection('tokens').findOne({ userId: searchUser._id });
        if (searchToken) await db.collection('tokens').updateOne({ userId: searchUser._id }, { $set: { token, timestamp: Date.now() } });
        else await db.collection('tokens').insertOne({ userId: searchUser._id, token, timestamp: Date.now() });
        return res.send(token);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
});

app.post('/transactions/send', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const value = Number(req.body.value);
    const description = req.body.description;

    if (!token) return res.sendStatus(401);
    if (isNaN(value) || value <= 0) return res.status(422).send('Invalid Value');
    if (description === undefined || description?.length < 1) return res.status(422).send('Invalid Description');
    const strippedDescription = stripHtml(description).result;

    try {
        const search = await db.collection('tokens').findOne({ token });
        if (!search) return res.status(401).send('Invalid Token');
        console.log(search);
        await db.collection('transactions').insertOne({ userId: search.userId, description, value, type: 'outbound' });
        return res.sendStatus(201);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
})

app.post('/transactions/receive', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const value = Number(req.body.value);
    const description = req.body.description;

    if (!token) return res.sendStatus(401);
    if (isNaN(value) || value <= 0) return res.status(422).send('Invalid Value');
    if (description === undefined || description?.length < 1) return res.status(422).send('Invalid Description');
    const strippedDescription = stripHtml(description).result;

    try {
        const search = await db.collection('tokens').findOne({ token });
        if (!search) return res.status(401).send('Invalid Token');
        console.log(search);
        await db.collection('transactions').insertOne({ userId: search.userId, description, value, type: 'inbound' });
        return res.sendStatus(201);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
})

app.get('/transactions', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.sendStatus(401);

    try {
        const searchToken = await db.collection('tokens').findOne({ token });
        if (!searchToken) return res.sendStatus(401);
        const transactions=await db.collection('transactions').find({userId: searchToken.userId}).toArray();
        return res.send(transactions);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
})

app.listen(process.env.PORT, () => console.log(`Server on ${process.env.PORT}`));