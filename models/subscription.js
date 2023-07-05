import mongoose from "mongoose";
const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId
    },
    packageId: {
        type: mongoose.Schema.Types.ObjectId, ref: "packagess"
    },
    paymentId: {
        type: String
    },
    userType: {
        type: String
        //dater, business
    },
    createdDate: {
        type: Date,
    },
    expireAt: {
        type: Date
    },
    status: {
        type: Number,
        default: 1
    }
});
subscriptionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })
export default mongoose.model("subscription", subscriptionSchema)
