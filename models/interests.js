
import mongoose from 'mongoose';
const interestsSchema = new mongoose.Schema({
    interestTypeId: {
        type: mongoose.Schema.Types.ObjectId, ref: "interestType"
    },
    interest: {
        type: String,
    },
    status: {
        type: Number,
        default: 1
        //1 = active, 2 = deleted
    }
});
export default mongoose.model('interests', interestsSchema);