import { ObjectId } from "mongodb";
import db from "../db.js";
import { stripHtml } from "string-strip-html";


export async function send(req, res){
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
        await db.collection('transactions').insertOne({ userId: search.userId, description: strippedDescription, value, type: 'outbound', timestamp: Date.now() });
        return res.sendStatus(201);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
};

export async function receive(req, res){
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
        await db.collection('transactions').insertOne({ userId: search.userId, description: strippedDescription, value, type: 'inbound', timestamp: Date.now() });
        return res.sendStatus(201);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
};

export async function getTransactions(req, res){
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.sendStatus(401);

    try {
        const searchToken = await db.collection('tokens').findOne({ token });
        if (!searchToken) return res.sendStatus(401);
        const transactions=await db.collection('transactions').find({userId: searchToken.userId}).toArray();
        return res.send(transactions);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
};

export async function deleteTransaction(req, res){
    const token=req.headers.authorization?.replace('Bearer ','');
    const {id}=req.body;
    if(!token) return res.status(401).send('Missing token');
    if(!id) return res.status(401).send('Missing id');

    try {
        const searchToken = await db.collection('tokens').findOne({ token });
        if (!searchToken) return res.status(401).send('Invalid token');
        const deletedLog = await db.collection('transactions').deleteOne({_id: new ObjectId(id), userId: searchToken.userId});
        return res.status(200).send('Entry deleted')
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
};

export async function putTransaction(req, res){
    const token=req.headers.authorization?.replace('Bearer ','');
    const {id}=req.body;
    const value = Number(req.body.value);
    const description = req.body.description;

    if (!token) return res.sendStatus(401);
    if(!id) return res.status(401).send('Missing id');
    if (isNaN(value) || value <= 0) return res.status(422).send('Invalid Value');
    if (description === undefined || description?.length < 1) return res.status(422).send('Invalid Description');
    const strippedDescription = stripHtml(description).result;

    try {
        const searchToken = await db.collection('tokens').findOne({ token });
        if (!searchToken) return res.status(401).send('Invalid token');
        const {modifiedCount}=await db.collection('transactions').updateOne({_id: new ObjectId(id), userId: searchToken.userId}, {$set: {value, description: strippedDescription}});
        return res.sendStatus(200);

    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
};