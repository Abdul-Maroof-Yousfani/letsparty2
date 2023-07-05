import mongoose from 'mongoose';

const bookEventSchema = new mongoose.Schema({
  eventID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  discountId:{
    type: mongoose.Schema.Types.ObjectId,
    default:0
  },
  discount: {
    type: Number,
    enum: [0, 1],
    default: 0
  },
  totalDiscountSeats: {
    type: Number,
    default:0
  },
  payAmount: {
    type: Number,
    required: true
  },
  totalDiscountAmount: {
    type: Number,
    default:0
  },
  paymentId: {
    type: String,
    default:0,
    required: true
  },
  status: {
    type: Number,
    default: 1
  },
  totalBookedSeats: {
    type: Number,
    required: true
  },
  remainderBeforeHalfhour: {
    type: Number,
    default:0 
  },
  remainderBeforeOnehour: {
    type: Number,
    default:0 
  },
  remainderBeforeOneDay: {
    type: Number,
    default:0 
  },
  addCalender: {
    type: Date,
    default:null
  }
  ,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const BookEvent = mongoose.model('BookEvent', bookEventSchema);
export default BookEvent;
