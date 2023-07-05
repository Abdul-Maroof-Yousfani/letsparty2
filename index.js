import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import upload from 'express-fileupload';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { MongoUtil } from './helpers/mongoUtils.js';
import chat from "./websockets/chat.js"
import users from "./routes/users.js";
import interests from "./routes/interests.js";
import interestTypes from "./routes/interestTypes.js";
import event from "./routes/event.js";
import bookEvent from "./routes/bookEvent.js";
import discount from "./routes/discount.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// index.js

dotenv.config();

var PORT = process.env.PORT;
var DB_URL = process.env.DB_URL;

const app = express();

const server = app.listen(3000);

import io from 'socket.io';
const socketIO = io(server);

app.use(cors());
app.use(express.json());
app.use(upload());
app.use(express.static("public"));

app.use("/api/users", users);
app.use("/api/interests", interests);
app.use("/api/interestTypes", interestTypes);
app.use("/api/events", event);
app.use("/api/bookingEvent", bookEvent);
app.use("/api/discount", discount);

chat.initChat();

mongoose.connect(DB_URL, (err, db) => {
    if (err) console.error(err);
    let dbo = db.client.db('LetsPartyNow');
    MongoUtil.getInstance(dbo);
    console.log('Database Connected!');
});
app.use(express.static(path.join(__dirname, 'web')));
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname,'web', 'index.html'));
});
app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));