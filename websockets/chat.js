import daters from '../models/users.js';
import chat from '../models/chat.js';
import Socket from 'socket.io';
import SimpleSchema from 'simpl-schema';
import mongoose from 'mongoose';
import commonHelper from "../helpers/commonHelper.js";
import uuidv4 from "uuidv4";

const messageSchema = new SimpleSchema({
    senderId: String,
    receiverId: String,
    type: String,
    message: String,
    file: {
        type: Buffer,
        optional: true
    }
}).newContext();

function initChat() {
    const io = new Socket(5403, {
        cors: {
            origin: '*'
        }
    });
    
    io.on('connection', (socket) => {
        socket.emit('connected', 'Connected! Please subscribe to register event now!');
        console.log("connected!")
        
        socket.on('disconnection', () => {
            console.log('User disconnected');
        });
        
        socket.on('register', (response) => {
            if (response.id == undefined)
            return socket.emit("err", "Registration failed! User is undefined");
            socket.join(response.id);
            return socket.emit("response", "Successfully Registered");
        });
        
        socket.on('offline', (response) => {
            if (response.id == undefined) return socket.emit("err", "Error! User is undefined");
            daters.findOne({ _id: response.id }).select('onlineStatus').then(status => {
                status.onlineStatus = 'OFFLINE';
                status.save((error, res) => {
                    if (error) return socket.emit('err', error.message);
                    return io.sockets.emit('userStatus', {
                        id: response.id,
                        onlineStatus: 'OFFLINE'
                    });
                });
            }).catch(error => { return socket.emit('err', error.message) });
        });
        
        socket.on('online', (response) => {
            if (response.id == undefined) return socket.emit("err", "Error! User is undefined");
            daters.findOne({ _id: response.id }).select('onlineStatus').then(status => {
                status.onlineStatus = 'ONLINE';
                status.save((error, res) => {
                    if (error) return socket.emit('err', error);
                    return io.sockets.emit('userStatus', {
                        id: response.id,
                        onlineStatus: 'ONLINE'
                    });
                });
            }).catch(error => { return socket.emit('err', error) });
        });
        
        socket.on('userStatus', (response) => {
            daters.findOne({ _id: response.id }).select('onlineStatus').then(status => {
                return socket.emit('userStatusRes', status);
            }).catch(error => { return socket.emit('err', error) });
        });
        
        socket.on('findFriends', async (response) => {
            let friendList = null;
            if(response.fullName != undefined || response.username != undefined) {
                friendList = await daters.find({ 
                    $or: [
                        { fullName: { $regex: '.*' + response.fullName + '.*', $options: 'i' } }, { username: { $regex: '.*' + response.username + '.*', $options: 'i' } }
                    ]
                }).select('fullName username profilePic onlineStatus').lean();
                if (!friendList) return socket.emit('err', `Error! No user found!`);
            }
            return socket.emit('friend', friendList);
        });
        
        socket.on("chatList", async (response) => {
            let list = await daters.findOne({ _id: response.id }).select("chatFriends").lean();
            if (list == null) return socket.emit("err", 'UserId is undefined');
            let results = [];
            
            let userlist = await Promise.all(list.chatFriends.map(async (list) => {
                return {
                    dater: await daters.findOne({ _id: list.dater }).select("fullName username profilePic onlineStatus status").lean(),
                    chat: list.chat,
                    unreadCount: await chat.find({ receiverId: response.id, readStatus: 0 }).count()
                }
            }));
            results = commonHelper.pagination(parseInt(response.page), parseInt(response.limit), userlist)
            return socket.emit('chatList', results);
        });
        
        socket.on('chatMessages', async (response) => {
            const updateReadStatus = await chat.updateOne({ receiverId: response.receiverId }, { $set: { readStatus: 1 } });
            if (!updateReadStatus) {
                return socket.emit('err', 'Something went wrong');
            }
            const sender = daters.findOne({ _id: response.senderId });
            const receiver = daters.findOne({ _id: response.receiverId });
            if (!sender) return socket.emit('err', `Error! No user found`);
            if (!receiver) return socket.emit('err', `Error! No user found`);
            let results = [];
            const chats = await chat.find({
                $or: [
                    { senderId: response.senderId, receiverId: response.receiverId }, { senderId: response.receiverId, receiverId: response.senderId }
                ]
            }).sort({ createdDate: 1 });
            results = commonHelper.pagination(parseInt(response.page), parseInt(response.limit), chats)
            return socket.emit('chatMessages', results);
        });
        
        socket.on('message', async (response) => {
            if (response.type == 'file' && response.file !== undefined) {
                response.file = Buffer.from(response.file, "base64");
            }
            const isValid = messageSchema.validate(response);
            if (!isValid) return socket.emit('err', `Error! Message does not satisfy the schema`);
            if (response.senderId == response.receiverId) return socket.emit('err', `Error! sender can't be the receiver`);
            const sender = await daters.findOne({ _id: response.senderId }).lean();
            const receiver = await daters.findOne({ _id: response.receiverId }).lean();
            if (!sender) return socket.emit('err', `The sender's ID doesn't exists`);
            if (!receiver) return socket.emit('err', `The receiver's ID doesn't exists`);
            
            if (response.type == "file") {
                response.message = `${uuidv4()}.${response.message.split('.')[1]}`;
                fs.writeFileSync(`public/uploads/chats/${response.message}`, response.file);
                delete response.file;
                response.message = `https://${process.env.DOMAIN}/uploads/chats/${response.message}`;
            }
            daters.findOne({ _id: response.senderId }).exec(function (err, array) {
                let findSenderChatList = array.chatFriends.findIndex(x => x.dater == response.receiverId)
                if (findSenderChatList == -1) {
                    array.chatFriends.push({
                        dater: mongoose.Types.ObjectId(response.receiverId),
                        chat: response.message
                    });
                } else {
                    array.chatFriends[findSenderChatList] = {
                        dater: mongoose.Types.ObjectId(response.receiverId),
                        chat: response.message,
                    }
                }
                array.save(function (err) {
                    if (err) socket.emit('err', "Something went worng");
                });
            });
            
            daters.findOne({ _id: response.receiverId }).exec(function (err, array) {
                let findSenderChatList = array.chatFriends.findIndex(x => x.dater == response.senderId)
                if (findSenderChatList == -1) {
                    array.chatFriends.push({
                        dater: mongoose.Types.ObjectId(response.senderId),
                        chat: response.message
                    });
                } else {
                    array.chatFriends[findSenderChatList] = {
                        dater: mongoose.Types.ObjectId(response.senderId),
                        chat: response.message,
                    }
                }
                array.save(function (err) {
                    if (err) socket.emit('err', "Something went worng");
                });
            });
            
            let payloadData = {};
            const senderName = await daters.findOne({_id: response.senderId}).select('fullName').exec();
            const receiverFcmToken = await daters.findOne({_id: response.receiverId}).select('fcmToken').exec();
            await new chat(response).save().then(async(message) => {
                socket.emit('message', message);
                socket.to(response.receiverId).emit('message', message);
                
                payloadData = message
                message = message.toObject();
                message.senderId = await daters.findById(message.senderId).select("fullName username profilePic onlineStatus status").exec();
                
                commonHelper.notificationHelper(receiverFcmToken.fcmToken, 'StarsTapIn', `New message from ${senderName.fullName}`, message, payloadData, response.receiverId)
            }).catch(err => socket.emit('err', err.message));
        });
        
        socket.on('stream', data => {
            socket.broadcast.emit('stream', data);
        });
        
    });
}

export default { initChat };