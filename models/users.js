import mongoose from 'mongoose';
const usersSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Full Name is required !"]
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Email is required !"]
    },
    password: {
        type: String,
        min: [8, "Password must be 8 characters !"],
        required: true
    },
    dob: {
        type: Date,
        default: ""
    },
    phoneNo: {
        type: String,
        default: ""
    },
    package: {
        type: String,
        default: ""
    },
    longitude: {
        type: Number,
        default: 0
    },
    latitude: {
        type: Number,
        default: 0
    },
    interests: [
        {
            interestId: {
                type: mongoose.Schema.Types.ObjectId, ref:"interests"
            }
        },
    ],
    cards: [
        {
            cardNumber: {
                type: Number
            },
            expiry: {
                type: Date
            },
            securityCode: {
                type: Number
            },
            name: {
                type: String
            },
        },
    ],
    onlineStatus: {
        type: String,
        default: 'Offline'
    },
    profilePic: {
        type: String,
        default: ""
    },
    chatFriends: {
        type: Array,
        default: []
    },
    otpCode: {
        type: Number,
        default: ""
    },
    jwtToken: {
        type: String,
        default: ""
    },
    fcmToken: {
        type: String,
        default: ""
    },
    status: {
        type: Number,
        default: 1
        //1 = active, 2 = suspend, 3 = deleted
    },
    followers: {
        type: Array,
        default: [],
      },
    createdDate: {
        type: Date,
        default: Date.now
    }
});
export default mongoose.model('users', usersSchema);