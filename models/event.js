import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  UserId:  {
    id: {
      type: mongoose.Schema.ObjectId,
      ref: 'users',
      required: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
    },
  },
  eventName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  ticket: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  eventDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  interest: {
    id: {
      type: mongoose.Schema.ObjectId,
      ref: 'interests',
      required: true,
    },
    interest: {
      type: String,
      required: true,
    },
  },
  interestType: {
    id: {
      type: mongoose.Schema.ObjectId,
      ref: 'interestTypes',
      required: true,
    },
    interestType: {
      type: String,
      required: true,
    },
  },
  venue: {
    type: String,
    required: true,
  },
  online: {
    type: Number,
    default: 0,
    required: true,
  },
  longitude: {
    type: Number,
    default: 0,
  },
  latitude: {
    type: Number,
    default: 0,
  },
  file: {
    type: String,
    required: false,
  },
  discount: {
    type: Number,
    default: 0,
  },
  discountVoucher: [
    {
      discountName: {
        type: String,
      },
      discountAmount: {
        type: Number,
      },
      discountPercentage: {
        type: Number,
      },
      tickets: {
        type: Number,
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      status: {
        type: Number,
        default: 1,
      }
    },
  ],
  likes: {
    type: Array,
    default: [],
  },
  status: {
    type: Number,
    default: 1,
  },
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
