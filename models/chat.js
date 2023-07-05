import mongoose from "mongoose";
const chatsSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId
    },
    message: {
        type: String
    },
    type: {
        type: String
    },
    readStatus: {
        type: Number,
        default: 0
        //0 = unread, 1 = read
    },
    createdDate: {
        type: Date,
        default: Date.now
    }

})
export default mongoose.model("chat", chatsSchema)