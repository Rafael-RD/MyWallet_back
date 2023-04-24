import db from "../db.js";
import joiSchemes from "../schemas/userSchema.js"
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from "uuid";

export async function signUp(req, res){
    const { name, email, password } = req.body;
    const validation = joiSchemes.postSignUp.validate({ name, email, password }, { abortEarly: false });
    if (validation.error) return res.status(422).send(validation.error.details.map(e => e.message.replaceAll('\"', '')));

    const hash = bcrypt.hashSync(validation.value.password, 10);

    try {
        const search = await db.collection('users').findOne({ email: validation.value.email });
        if (search) return res.sendStatus(409);
        await db.collection('users').insertOne({ name: validation.value.name, email: validation.value.email, password: hash });
        return res.sendStatus(201);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
};

export async function logIn(req, res){
    const { email, password } = req.body;
    
    const validation = joiSchemes.postLogin.validate({ email, password }, { abortEarly: false });
    if (validation.error) return res.status(422).send(validation.error.details.map(e => e.message.replaceAll('\"', '')));
    try {
        const searchUser = await db.collection('users').findOne({ email: validation.value.email });
        if (!searchUser) return res.status(404).send('Email not registered');
        if (bcrypt.compareSync(validation.value.password, searchUser.password) === false) return res.status(401).send('Wrong password');
        const token = uuidv4();
        const searchToken = await db.collection('tokens').findOne({ userId: searchUser._id });
        if (searchToken) await db.collection('tokens').updateOne({ userId: searchUser._id }, { $set: { token, timestamp: Date.now() } });
        else await db.collection('tokens').insertOne({ userId: searchUser._id, token, timestamp: Date.now() });
        return res.send({token, name: searchUser.name});
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
};