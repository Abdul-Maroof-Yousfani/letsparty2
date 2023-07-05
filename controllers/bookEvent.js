import Event from '../models/event.js';
import BookEvent from '../models/bookEvent.js';
import Users from '../models/users.js';
import commonHelper from '../helpers/commonHelper.js';

const bookingEvent = async (req, res) => {
  try {
    const eventID = req.body.eventID;
    const userID = req.body.userID;
    const discountCode = req.body.discount;
    const totalDiscountSeats = req.body.totalDiscountSeats;
    let discountId = 0;
    let discountCheck = 0;
    const totalBookedSeats = req.body.tickets;

    const existingEvent = await Event.findOne({ _id: eventID, status: 1 }).lean();
    const existingUsers = await Users.findOne({ _id: userID, status: 1 }).lean();
    const existsBookEvent = await BookEvent.findOne({ userID: userID, eventID: eventID, status: 1 }).lean();

    if (!existingEvent) {
      return commonHelper.handleResponse(res, 404, 'Event', '');
    }

    if (!existingUsers) {
      return commonHelper.handleResponse(res, 404, 'User', '');
    }

    if (existsBookEvent) {
      return commonHelper.handleResponse(res, 400, null, 'event is already booked by  you');
    }


    if (discountCode) {
      const discountResult = await discountvalidation(eventID, userID, discountCode);
      if (!discountResult.success) {
        return commonHelper.handleResponse(res, 400, discountResult, discountResult.message);
      }
      discountId = discountResult.discount._id;
      discountCheck = 1;
    }

    if (!totalBookedSeats) {
      return commonHelper.handleResponse(res, 400, null, 'Booking of tickets is not defined.');
    }

    const BookEventlimit = await BookEvent.findOne({ eventID: eventID, status: 1 }).lean();

    if (existingEvent.ticket > 0) {
      if (BookEventlimit) {
        const totalTickets = BookEventlimit.totalBookedSeats || 0;
        const remainingTickets = existingEvent.ticket - totalTickets;

        if (remainingTickets <= 0) {
          return commonHelper.handleResponse(res, 400, null, 'All tickets have already been booked.');
        } else if (remainingTickets < req.body.tickets) {
          return commonHelper.handleResponse(
            res,
            400,
            remainingTickets,
            'You are trying to buy more tickets than the remaining tickets.'
          );
        }
      }
    }

    const eventDate = new Date(existingEvent.eventDate);
    const currentTime = new Date();
    const eventStartTime = new Date("2000-01-01 " + existingEvent.startTime);

    if (eventDate < currentTime) {
      return commonHelper.handleResponse(res, 400, null, 'Event date has passed. Booking is not allowed.');
    }

    const formattedCurrentTime = new Date().setHours(currentTime.getHours(), currentTime.getMinutes());
    const formattedStartTime = new Date().setHours(eventStartTime.getHours(), eventStartTime.getMinutes());

    if (eventDate.getTime() === currentTime.getTime() && formattedStartTime < formattedCurrentTime) {
      return commonHelper.handleResponse(res, 400, null, 'Booking time has passed. Booking is not allowed.');
    }

    const data = {
      eventID,
      userID,
      eventData: existingEvent,
      "discountId": discountId !== 0 ? discountId : undefined,
      discount: discountCheck,
      totalDiscountSeats,
      totalBookedSeats,
      payAmount: req.body.payAmount,
      totalDiscountAmount: req.body.totalDiscountAmount
    };

    const BookEvents = new BookEvent(data);
    const savedBookEvent = await BookEvents.save();

    return commonHelper.handleResponse(res, 200, savedBookEvent, 'create');
  } catch (error) {
    // Call commonHelper.handleResponse() with error response if an error occurs
    return commonHelper.handleResponse(res, 500, null, 'create', error);
  }
};


const discountCheck = async (req, res) => {
  try {

    const eventID = req.query.eventID;
    const userID = req.query.userID;
    const discountCode = req.query.discount;


    const discountResult = await discountvalidation(eventID, userID, discountCode);

    if (!discountResult.success) {
      return commonHelper.handleResponse(res, 400, null, discountResult.message);
    }

    return commonHelper.handleResponse(res, 200, discountResult.discount, discountResult.message);


  } catch (error) {
    // Call commonHelper.handleResponse() with error response if an error occurs
    return commonHelper.handleResponse(res, 500, null, 'create', error);
  }
};


const discountvalidation = async (eventID, userID, discountCode) => {
  const currentTime = new Date();

  const existingEvent = await Event.findOne({ _id: eventID, status: 1 }).lean();
  const existingUsers = await Users.findOne({ _id: userID, status: 1 }).lean();
  const existsBookEvent = await BookEvent.findOne({ userID: userID, eventID: eventID, status: 1 }).lean();

  if (!existingEvent) {
    return { success: false, message: 'Event not found' };
  }

  if (!existingUsers) {
    return { success: false, message: 'User not found' };
  }

  const discount = existingEvent.discountVouncher.find((d) => {
    return d.discountName === discountCode;
  });

  if (!discount) {
    return { success: false, message: 'Invalid discount' };
  }

  const startDate = new Date(discount.startDate);
  const endDate = new Date(discount.endDate);

  if (endDate <= currentTime) {
    return { success: false, message: 'Discount has expired' };
  }

  if (existsBookEvent && discount._id == existsBookEvent.discountId) {
    return { success: false, message: 'You have already availed this discount' };
  }

  const discountId = discount._id;

  const result = await BookEvent.aggregate([
    {
      $match: {
        discountId: discountId,
        status: 1,
      },
    },
    {
      $group: {
        _id: discountId,
        totalDiscountSeats: { $sum: '$totalDiscountSeats' },
      },
    },
  ]);

  if (result.length > 0) {
    const remainingTickets = +result[0].totalDiscountSeats - discount.tickets;

    if (remainingTickets > 0) {

      discount.tickets = remainingTickets;
      return { success: true, message: 'Valid discount on this remaining seats ' + remainingTickets, discount: discount };
    } else {
      return { success: false, message: 'All discounted seats have been booked' };
    }
  }

  return { success: true, message: 'Valid discount', discount: discount };
};


const addCalenderOrRemainder = async (req, res) => {
  try {
    const userID = req.body.userID; // Assuming userID is available in the request body
    const eventID = req.body.eventID; // Assuming eventID is available in the request body
    const addCalender = req.body.addCalender || null;
    const remainderBeforeHalfhour = req.body.remainderBeforeHalfhour || 0;
    const remainderBeforeOnehour = req.body.remainderBeforeOnehour || 0;
    const remainderBeforeOneDay = req.body.remainderBeforeOneDay || 0;
  
    let updatedBookEvent;
    if(addCalender)
    {
       updatedBookEvent = await BookEvent.findOneAndUpdate(
        { userID: userID, eventID: eventID, status: 1 },
        { $set: { addCalender} },
        { new: true }
      );
    }
    else
    {
       updatedBookEvent = await BookEvent.findOneAndUpdate(
        { userID: userID, eventID: eventID, status: 1 },
        { $set: { remainderBeforeHalfhour, remainderBeforeOnehour, remainderBeforeOneDay } },
        { new: true }
      );

    }

    if (!updatedBookEvent) {
      return commonHelper.handleResponse(res, 400, 'Book Event', '');
    }

    // Rest of your code
    return commonHelper.handleResponse(res, 200, updatedBookEvent, 'update');

  } catch (error) {
    // Call commonHelper.handleResponse() with error response if an error occurs
    return commonHelper.handleResponse(res, 500, null, 'update', error);
  }
};

const getAllCalenderEvent = async (req, res) => {
  try {
    const userID = req.query.userID; // Assuming userID is available in the request params
  
    const currentDate = new Date(); // Get the current date
    
    const events = await BookEvent.find({ 
      userID: userID, 
      status: 1,
      addCalender: { $ne: null },
      eventDate: { $gt: currentDate }
    }).lean();
  
    if (!events || events.length === 0) {
      return commonHelper.handleResponse(res, 404, 'Book Event', '');
    }
  
    return commonHelper.handleResponse(res, 200, events, 'select all');
  
  } catch (error) {
    // Call commonHelper.handleResponse() with error response if an error occurs
    return commonHelper.handleResponse(res, 500, null, 'update', error);
  }
};

const myBookingList = async (req, res) => {
  try {
    const userID = req.query.userID; // Assuming userID is available in the request params
  
    const currentDate = new Date(); // Get the current date
    
    const events = await BookEvent.find({ 
      userID: userID, 
      status: 1,
      eventDate: { $gt: currentDate }
    }).lean();
  
    if (!events || events.length === 0) {
      return commonHelper.handleResponse(res, 404, 'Book Event', '');
    }
  
    return commonHelper.handleResponse(res, 200, events, 'select all');
  
  } catch (error) {
    // Call commonHelper.handleResponse() with error response if an error occurs
    return commonHelper.handleResponse(res, 500, null, 'update', error);
  }
};

export {
  bookingEvent,
  discountCheck,
  addCalenderOrRemainder,
  getAllCalenderEvent,
  myBookingList
};
