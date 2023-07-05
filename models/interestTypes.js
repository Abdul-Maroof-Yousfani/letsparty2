import mongoose from 'mongoose';
const interestTypesSchema = new mongoose.Schema({
    interestType: {
        type: String,
    },
    status: {
        type: Number,
        default: 1
        //1 = active, 2 = deleted
    }
});
export default mongoose.model('interestTypes', interestTypesSchema);