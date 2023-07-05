import Event from '../models/event.js';
import commonHelper from '../helpers/commonHelper.js';
import eventHelper from '../helpers/eventHelper.js';
import users from '../models/users.js';
import interests from "../models/interests.js"
import interestTypes from "../models/interestTypes.js"
import mongoose from 'mongoose';

// Create a new event
const createEvent = async (req, res) => {
  try {
    const directoryPath = "public/uploads/events";
    const uploadResult = await commonHelper.uploadFile(req.files.file, directoryPath, null);

    if (req.body?.discount) {
      req.body.discount = JSON.parse(req.body.discount);
    }

    if (uploadResult.message === true) {
      req.body.file = uploadResult.data;
    }

    if (uploadResult.status === 404) {
      delete req.body.file;
    }

    // Trim and convert strings to ObjectId if they are in the correct format
    if (mongoose.Types.ObjectId.isValid(req.body.UserId)) {
      req.body.UserId = mongoose.Types.ObjectId(req.body.UserId.trim());
    }
    if (mongoose.Types.ObjectId.isValid(req.body.interestType)) {
      req.body.interestType = mongoose.Types.ObjectId(req.body.interestType.trim());
    }
    if (mongoose.Types.ObjectId.isValid(req.body.interest)) {
      req.body.interest = mongoose.Types.ObjectId(req.body.interest.trim());
    }

    const userData = await users.findOne({ _id: req.body.UserId, status: 1 }).lean();
    
    if (!userData) {
      return commonHelper.handleResponse(res, 404,'user', '');
    }

    const interestData = await interests.findOne({ _id: req.body.interest, interestTypeId: req.body.interestType, status: 1 }).lean();
    
    if (!interestData) {
      return commonHelper.handleResponse(res, 404,'interest', '');
    }
    
    const interestTypeData = await interestTypes.findOne({ _id: req.body.interestType, status: 1 }).lean();
    
    if (!interestTypeData) {
      return commonHelper.handleResponse(res, 404,'interest type', '');
    }

    req.body.UserId = {id:userData._id,fullname:userData.fullName,email:userData.email,profilePic:userData.profilePic} ;
    req.body.interestType = {id:interestTypeData._id,interestType:interestTypeData.interestType};
    req.body.interest = {id:interestData._id,interest:interestData.interest};

    // return commonHelper.handleResponse(res, 404,req.body, 'as');

    // Create the event
    const event = new Event(req.body);
    const savedEvent = await event.save();



    const events = await eventHelper.reuseableEventData(savedEvent._id,null, null, null, null, null);




    return commonHelper.handleResponse(res, 200, events, 'create');
  } catch (error) {
    console.error('Error:', error); // Log the error for debugging
    return commonHelper.handleResponse(res, 500, null, 'create', error);
  }
};



// Get all events
const getAllEvents = async (req, res) => {
  try {
    
    const interestId = req.query?.interestId ? req.query?.interestId : null;
    const interesttypId = req.query?.interesttypId ? req.query?.interesttypId : null;
    const price = req.query?.price ? req.query?.price : null;
    const eventName = req?.query?.name ? req?.query?.name : null ;
    const distance = req.query?.distance ? req.query?.distance : 300;
    const lat = req.query?.lat ? req.query?.lat : null;
    const long = req.query?.long ? req.query?.long : null;
    const userId = req.query?.userId ? req.query?.userId : null ;
    const followerId = req.query?.followerId ? req.query?.followerId : '' ;
    const eventId = req?.query?.eventId ?  req?.query?.eventId : null ;
    const page = req.query.page ? req.query.page : 1;
    const limit = req.query.limit ? req.query.limit : 5;


    const events = await eventHelper.reuseableEventData(eventId,userId, eventName, price, interestId, interesttypId);

    if (!events || events.length === 0) {
      return commonHelper.handleResponse(res, 404, 'Event', '');
    }

    let data = await commonHelper.filter(followerId, distance, lat, long, events);

    data = await commonHelper.pagination(page, limit, data)

    return commonHelper.handleResponse(res, 200, data, 'select all');
  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'select all', error);
  }
};

// Get a specific event by ID
const getEventById = async (req, res) => {
  try {
  
    const event = await eventHelper.reuseableEventData(req?.params?.id,null, null, null, null, null);

    if (!event) {
      return commonHelper.handleResponse(res, 404, 'Event', '');
    }
    return commonHelper.handleResponse(res, 200, event, 'select single');
  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'select single', error);
  }
};

// Get a search event by name

const searchEventByName = async (req, res) => {
  try {
    
    const interestId = req.query?.interestId ? req.query?.interestId : null;
    const interesttypId = req.query?.interesttypId ? req.query?.interesttypId : null;
    const price = req.query?.price ? req.query?.price : null;
    const eventName = req?.query?.name ? req?.query?.name : null ;
    const distance = req.query?.distance ? req.query?.distance : 300;
    const lat = req.query?.lat ? req.query?.lat : null;
    const long = req.query?.long ? req.query?.long : null;
    const userId = req.query?.userId ? req.query?.userId : null ;
    const followerId = req.query?.followerId ? req.query?.followerId : '' ;
    const eventId = req?.query?.eventId ?  req?.query?.eventId : null ;
    const page = req.query.page ? req.query.page : 1;
    const limit = req.query.limit ? req.query.limit : 5;


    const events = await eventHelper.reuseableEventData(eventId,userId, eventName, price, interestId, interesttypId);

    if (!events || events.length === 0) {
      return commonHelper.handleResponse(res, 404, 'Event', '');
    }
    
    let data = await commonHelper.filter(followerId, distance, lat, long, events);

    data = await commonHelper.pagination(page, limit, data)

    return commonHelper.handleResponse(res, 200, data, 'select all');

  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'select all', error);
  }
};


// Update an event
const updateEvent = async (req, res) => {
  try {
    const existingEvent = await Event.findOne({ _id: req.body.id, status: 1 });

    if (!existingEvent) {
      return commonHelper.handleResponse(res, 404, 'Event', '');
    }

    const directoryPath = "public/uploads/events";
    const uploadResult = await commonHelper.uploadFile(req.files.file, directoryPath, existingEvent.file);
    if (uploadResult.message === true) {
      req.body.file = uploadResult.data;
    }
    if (uploadResult.status === 404) {
      delete req.body.file;
    }

    // Parse the discount field if it exists in the request body
    req.body.discount = req.body.discount ? JSON.parse(req.body.discount) : existingEvent.discount;

    const userData = await users.findOne({ _id: req.body.UserId, status: 1 }).lean();
    
    if (!userData) {
      return commonHelper.handleResponse(res, 404,'user', '');
    }

    const interestData = await interests.findOne({ _id: req.body.interest, interestTypeId: req.body.interestType, status: 1 }).lean();
    
    if (!interestData) {
      return commonHelper.handleResponse(res, 404,'interest', '');
    }
    
    const interestTypeData = await interestTypes.findOne({ _id: req.body.interestType, status: 1 }).lean();
    
    if (!interestTypeData) {
      return commonHelper.handleResponse(res, 404,'interest type', '');
    }

    req.body.UserId = {id:userData._id,fullname:userData.fullName,email:userData.email,profilePic:userData.profilePic} ;
    req.body.interestType = {id:interestTypeData._id,interestType:interestTypeData.interestType};
    req.body.interest = {id:interestData._id,interest:interestData.interest};



    const event = await Event.findOneAndUpdate(
      { _id: req?.body?.id, 'UserId.id': userData._id, status: 1 },
      { ...req.body },
      { new: true }
    );

    const data = await eventHelper.reuseableEventData(req?.body?.id,null, null, null, null, null);

    return commonHelper.handleResponse(res, 200, data, 'update');

  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'update', error);
  }
};




// Delete an event (set status to 2)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, status: 1 },
      { $set: { status: 2 } }
    );
    if (!event) {
      return commonHelper.handleResponse(res, 404, 'Event', '');
    }
    return commonHelper.handleResponse(res, 200, null, 'delete');
  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'delete', error);
  }
};

// Add and remove a like to an event
const toggleLike = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.body.id, status: 1 }).lean();
    if (!event) {
      return commonHelper.handleResponse(res, 404, null, '');
    }

    const userId = req.body.userId;
    let action = ''; // Declare the 'action' variable with a default value

    // Check if the user has already liked the event
    const existingIndex = event.likes.findIndex((like) => like.userId.toString() === userId.toString());

    if (existingIndex !== -1) {
      // User has already liked the event, so remove the like
      event.likes.splice(existingIndex, 1);
      action = 'unlike'; // Set the action as 'unlike'
    } else {
      // User has not liked the event, so add the like
      const user = await users.findOne({ _id: userId }).lean();
      if (!user) {
        return commonHelper.handleResponse(res, 404, null, '');
      }
      event.likes.push({ userId: user._id, name: user.fullName, email: user.email, profilePic: user.profilePic });
      action = 'like'; // Set the action as 'like'
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.body.id, { likes: event.likes }, { new: true });

    return commonHelper.handleResponse(res, 200, updatedEvent, action); // Include the 'action' in the response
  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'update', error);
  }
};

const getUserLikesEvents = async (req, res) => {
  try {

    const userId = req.query.userId;

    const events = await Event.aggregate([
      {
        $match: { status: 1 }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'likes.userId',
          foreignField: '_id',
          as: 'likedUsers'
        }
      },
      {
        $unwind: '$likedUsers'
      },
      {
        $match: { 'likedUsers._id': mongoose.Types.ObjectId(userId) }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $addFields: {
          creator: { $arrayElemAt: ['$creator', 0] }
        }
      },
      {
        $lookup: {
          from: 'bookingevents',
          let: { eventId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$eventId', '$$eventId'] },
                status: { $in: [1, 2] } // Consider only active and confirmed bookings
              }
            }
          ],
          as: 'bookings'
        }
      },
      {
        $addFields: {
          totalBookedSeats: { $size: '$bookings' }
        }
      },
      {
        $project: {
          _id: 1,
          eventName: 1,
          description: 1,
          phoneNumber: 1,
          ticket: 1,
          price: 1,
          eventDate: 1,
          startTime: 1,
          endTime: 1,
          type: 1,
          category: 1,
          venue: 1,
          online: 1,
          longitude: 1,
          latitude: 1,
          file: 1,
          discount: 1,
          discountVouncher: 1,
          likes: 1,
          status: 1,
          totalBookedSeats: 1
        }
      }
    ]);


    return commonHelper.handleResponse(res, 200, events, 'select all'); // Include the 'action' in the response
  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'select all', error);
  }
};

// home screen apis
const getAllEventsAtHome = async (req, res) => {
  try {

    const interestId = req.query?.interestId ? req.query?.interestId : null;
    const interesttypId = req.query?.interesttypId ? req.query?.interesttypId : null;
    const price = req.query?.price ? req.query?.price : null;
    const eventName = req?.query?.name ? req?.query?.name : null ;
    const distance = req.query?.distance ? req.query?.distance : 300;
    const lat = req.query?.lat ? req.query?.lat : null;
    const long = req.query?.long ? req.query?.long : null;
    const userId = req.query?.userId ? req.query?.userId : null ;
    const followerId = req.query?.followerId ? req.query?.followerId : '' ;
    const eventId = req?.query?.eventId ?  req?.query?.eventId : null ;
    const page = req.query.page ? req.query.page : 1;
    const limit = req.query.limit ? req.query.limit : 5;

    let interestTypesData = await eventHelper.reuseableInterestType();
    interestTypesData = await commonHelper.pagination(page, limit, interestTypesData)
    if (!interestTypesData || interestTypesData.length === 0) {
      return commonHelper.handleResponse(res, 404, 'interest Types', '');
    }

    let featuredEventData = await eventHelper.reuseableFeaturedEvent();
    
    featuredEventData = await commonHelper.filter(followerId, distance, lat, long, featuredEventData);
    // return commonHelper.handleResponse(res, 404, featuredEventData, 'ac');


    featuredEventData = await commonHelper.pagination(page, limit, featuredEventData)
    if (!featuredEventData || featuredEventData.length === 0) {
      return commonHelper.handleResponse(res, 404, 'interest Types', '');
    }

    let recommandEventData = await eventHelper.reuseableRecommandation();
    
    
    recommandEventData = await commonHelper.filter(followerId, distance, lat, long, recommandEventData);
    recommandEventData = await commonHelper.pagination(page, limit, recommandEventData)
    if (!recommandEventData || recommandEventData.length === 0) {
      return commonHelper.handleResponse(res, 404, 'interest Types', '');
    }
    
    let reuseablePopular = await eventHelper.reuseablePopular();
  
    reuseablePopular = await commonHelper.filter(followerId, distance, lat, long, reuseablePopular);
    reuseablePopular = await commonHelper.pagination(page, limit, reuseablePopular)
    if (!reuseablePopular || reuseablePopular.length === 0) {
      return commonHelper.handleResponse(res, 404, 'interest Types', '');
    }
    
    
    const data = [
      {
        "category_list": interestTypesData.result,
        "featured_list": featuredEventData.result,
        "recommand_list": recommandEventData.result,
        "popular_list": reuseablePopular.result,
      }
    ]

    return commonHelper.handleResponse(res, 200, data, 'select all');

  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'select all', error);
  }
};

const viewAllcategories = async (req, res) => {
  try {

    const interestId = req.query?.interestId ? req.query?.interestId : null;
    const interesttypId = req.query?.interesttypId ? req.query?.interesttypId : null;
    const price = req.query?.price ? req.query?.price : null;
    const eventName = req?.query?.name ? req?.query?.name : null ;
    const distance = req.query?.distance ? req.query?.distance : 300;
    const lat = req.query?.lat ? req.query?.lat : null;
    const long = req.query?.long ? req.query?.long : null;
    const userId = req.query?.userId ? req.query?.userId : null ;
    const followerId = req.query?.followerId ? req.query?.followerId : '' ;
    const eventId = req?.query?.eventId ?  req?.query?.eventId : null ;
    const page = req.query.page ? req.query.page : 1;
    const limit = req.query.limit ? req.query.limit : 5;

    let interestTypesData = await eventHelper.reuseableInterestType();
    interestTypesData = await commonHelper.pagination(page, limit, interestTypesData)
    if (!interestTypesData.result || interestTypesData.result.length === 0) {
      return commonHelper.handleResponse(res, 404, 'interest Types', '');
    }

    return commonHelper.handleResponse(res, 200, interestTypesData.result, 'select all');

  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'select all', error);
  }
};

const viewAllfeaturedEvent = async (req, res) => {
  try {

    const interestId = req.query?.interestId ? req.query?.interestId : null;
    const interesttypId = req.query?.interesttypId ? req.query?.interesttypId : null;
    const price = req.query?.price ? req.query?.price : null;
    const eventName = req?.query?.name ? req?.query?.name : null ;
    const distance = req.query?.distance ? req.query?.distance : 300;
    const lat = req.query?.lat ? req.query?.lat : null;
    const long = req.query?.long ? req.query?.long : null;
    const userId = req.query?.userId ? req.query?.userId : null ;
    const followerId = req.query?.followerId ? req.query?.followerId : '' ;
    const eventId = req?.query?.eventId ?  req?.query?.eventId : null ;
    const page = req.query.page ? req.query.page : 1;
    const limit = req.query.limit ? req.query.limit : 5;

    let featuredEventData = await eventHelper.reuseableFeaturedEvent();

    featuredEventData = await commonHelper.filter(followerId, distance, lat, long, featuredEventData);

    featuredEventData = await commonHelper.pagination(page, limit, featuredEventData);
    if (!featuredEventData.result || featuredEventData.result.length === 0) {
      return commonHelper.handleResponse(res, 404, 'events', '');
    }

    return commonHelper.handleResponse(res, 200, featuredEventData.result, 'select all');

  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'select all', error);
  }
};

const viewAllRecommadationEvent = async (req, res) => {
  try {

    const interestId = req.query?.interestId ? req.query?.interestId : null;
    const interesttypId = req.query?.interesttypId ? req.query?.interesttypId : null;
    const price = req.query?.price ? req.query?.price : null;
    const eventName = req?.query?.name ? req?.query?.name : null ;
    const distance = req.query?.distance ? req.query?.distance : 300;
    const lat = req.query?.lat ? req.query?.lat : null;
    const long = req.query?.long ? req.query?.long : null;
    const userId = req.query?.userId ? req.query?.userId : null ;
    const followerId = req.query?.followerId ? req.query?.followerId : '' ;
    const eventId = req?.query?.eventId ?  req?.query?.eventId : null ;
    const page = req.query.page ? req.query.page : 1;
    const limit = req.query.limit ? req.query.limit : 5;

    let recommandEventData = await eventHelper.reuseableRecommandation();

    recommandEventData = await commonHelper.filter(followerId, distance, lat, long, recommandEventData);
    recommandEventData = await commonHelper.pagination(page, limit, recommandEventData)
    if (!recommandEventData.result || recommandEventData.result.length === 0) {
      return commonHelper.handleResponse(res, 404, 'events', '');
    }


    return commonHelper.handleResponse(res, 200, recommandEventData.result, 'select all');

  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'select all', error);
  }
};

const viewAllPopularEvent = async (req, res) => {
  try {

    const interestId = req.query?.interestId ? req.query?.interestId : null;
    const interesttypId = req.query?.interesttypId ? req.query?.interesttypId : null;
    const price = req.query?.price ? req.query?.price : null;
    const eventName = req?.query?.name ? req?.query?.name : null ;
    const distance = req.query?.distance ? req.query?.distance : 300;
    const lat = req.query?.lat ? req.query?.lat : null;
    const long = req.query?.long ? req.query?.long : null;
    const userId = req.query?.userId ? req.query?.userId : null ;
    const followerId = req.query?.followerId ? req.query?.followerId : '' ;
    const eventId = req?.query?.eventId ?  req?.query?.eventId : null ;
    const page = req.query.page ? req.query.page : 1;
    const limit = req.query.limit ? req.query.limit : 5;


    let reuseablePopular = await eventHelper.reuseablePopular();

    reuseablePopular = await commonHelper.filter(followerId, distance, lat, long, reuseablePopular);
    reuseablePopular = await commonHelper.pagination(page, limit, reuseablePopular)
    if (!reuseablePopular.result || reuseablePopular.result.length === 0) {
      return commonHelper.handleResponse(res, 404, 'events', '');
    }


    return commonHelper.handleResponse(res, 200, reuseablePopular.result, 'select all');

  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'select all', error);
  }
};



export {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  toggleLike,
  getAllEventsAtHome,
  viewAllcategories,
  viewAllfeaturedEvent,
  viewAllRecommadationEvent,
  viewAllPopularEvent,
  searchEventByName,
  getUserLikesEvents
};
