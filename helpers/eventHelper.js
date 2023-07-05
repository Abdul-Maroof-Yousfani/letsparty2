import Event from '../models/event.js';
import interestTypes from '../models/interestTypes.js';
import mongoose from 'mongoose';

const reuseableInterestType = async () => {
  try {
    const interestTypesData = await interestTypes.find({ status: 1 }).select('-status').lean();
    return interestTypesData;
  } catch (error) {
    throw new Error('An error occurred');
  }
};

const reuseableFeaturedEvent = async () => {
  try {
    const featured = await reuseableEventData(null) ; 
    return featured;

  } catch (error) {
    throw new Error('An error occurred');
  }
};

const reuseableRecommandation = async () => {
  try {
    const events = await reuseableEventData(null) ; 

    return events;
  } catch (error) {
    // Handle error
    throw new Error('An error occurred');

  }
};

const reuseablePopular = async () => {
  try {
    const events = await reuseableEventData(null)

    return events;
  } catch (error) {
    // Handle error
    throw new Error('An error occurred');

  }
};

const filterEventDataByTimeFrame = (eventData, timeFrame) => {
  let filteredData = [];

  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  if (timeFrame === 'today') {
    filteredData = eventData.filter((event) => {
      const eventDate = new Date(event.eventDate);
      const eventDay = eventDate.getDate();
      const eventMonth = eventDate.getMonth();
      const eventYear = eventDate.getFullYear();

      return (
        eventDay === currentDay &&
        eventMonth === currentMonth &&
        eventYear === currentYear
      );
    });
  } else if (timeFrame === 'tomorrow') {
    const tomorrowDate = new Date();
    tomorrowDate.setDate(currentDay + 1);

    filteredData = eventData.filter((event) => {
      const eventDate = new Date(event.eventDate);
      const eventDay = eventDate.getDate();
      const eventMonth = eventDate.getMonth();
      const eventYear = eventDate.getFullYear();

      return (
        eventDay === tomorrowDate.getDate() &&
        eventMonth === tomorrowDate.getMonth() &&
        eventYear === tomorrowDate.getFullYear()
      );
    });
  } else if (timeFrame === 'this week') {
    const weekEndDate = new Date();
    weekEndDate.setDate(currentDay + 6); // Assuming a week ends after 6 days

    filteredData = eventData.filter((event) => {
      const eventDate = new Date(event.eventDate);
      const eventDay = eventDate.getDate();
      const eventMonth = eventDate.getMonth();
      const eventYear = eventDate.getFullYear();

      return (
        eventDate >= currentDate && eventDate <= weekEndDate &&
        eventYear === currentYear &&
        eventMonth === currentMonth
      );
    });
  } else if (timeFrame === 'next week') {
    const nextWeekStartDate = new Date();
    nextWeekStartDate.setDate(currentDay + 7); // Assuming a week starts after 7 days

    const nextWeekEndDate = new Date();
    nextWeekEndDate.setDate(currentDay + 13); // Assuming a week ends after 13 days

    filteredData = eventData.filter((event) => {
      const eventDate = new Date(event.eventDate);
      const eventDay = eventDate.getDate();
      const eventMonth = eventDate.getMonth();
      const eventYear = eventDate.getFullYear();

      return (
        eventDate >= nextWeekStartDate && eventDate <= nextWeekEndDate &&
        eventYear === currentYear &&
        eventMonth === currentMonth
      );
    });
  }

  return filteredData;
};

const reuseableEventData = async (eventId,userId,eventName,price,interestId,interesttypId) =>
{

  const matchQuery = {
    status: 1 // Matches events with status 1
  };

  if (eventId) {
    matchQuery['_id'] = mongoose.Types.ObjectId(eventId);
  }

  if (userId) {
    matchQuery['UserId.id'] = mongoose.Types.ObjectId(userId);
  }
  if (interestId) {
    matchQuery['interest.id'] = mongoose.Types.ObjectId(interestId);
  }
  if (interesttypId) {
    matchQuery['interestType.id'] = mongoose.Types.ObjectId(interesttypId);
  }
  if (price) {
    matchQuery['price'] = { $lte: Number(price) };
  }

  if (eventName) {
    matchQuery.$or = [
      { eventName: { $regex: eventName, $options: 'i' } }, // Matches eventName using regex
      { eventName: { $regex: new RegExp('.*' + eventName + '.*', 'i') } } // Matches partial word in eventName using regex
    ];
  }


  let events = await Event.aggregate([
    // Match the documents with status 1 (active)
     {
      $match: matchQuery
    }
    ,
    // Perform a left join with the BookEvent collection
    {
      $lookup: {
        from: 'bookevents',
        localField: '_id',
        foreignField: 'eventID',
        as: 'bookings'
      }
    },
    // Unwind the bookings array
    {
      $unwind: {
        path: '$bookings',
        preserveNullAndEmptyArrays: true
      }
    },
    // Group by the Event fields and calculate totalBookedSeats, totalPayAmount, and totalDiscountAmount
    {
      $group: {
        _id: '$_id',
        event: {
          $first: '$$ROOT'
        },
        totalBookedSeats: {
          $sum: {
            $cond: [
              { $ifNull: ['$bookings.totalBookedSeats', false] },
              '$bookings.totalBookedSeats',
              0
            ]
          }
        },
        totalPayAmount: {
          $sum: {
            $cond: [
              { $ifNull: ['$bookings.payAmount', false] },
              '$bookings.payAmount',
              0
            ]
          }
        },
        totalDiscountAmount: {
          $sum: {
            $cond: [
              { $ifNull: ['$bookings.totalDiscountAmount', false] },
              '$bookings.totalDiscountAmount',
              0
            ]
          }
        },
        
      }
    },
    // Lookup the users collection to join UserId.id with the users table
    {
      $lookup: {
        from: 'users',
        localField: 'event.UserId.id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $lookup: {
        from: 'interests',
        localField: 'event.interest.id',
        foreignField: '_id',
        as: 'interestdata'
      }
    },
    {
      $lookup: {
        from: 'interestTypes',
        localField: 'event.interestType.id',
        foreignField: '_id',
        as: 'interestTypesdata'
      }
    },
    // Unwind the user array
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true
      }
    },
    // Unwind the interestdata array
    {
      $unwind: {
        path: '$interestdata',
        preserveNullAndEmptyArrays: true
      }
    },
    // Unwind the interestTypesdata array
    {
      $unwind: {
        path: '$interestTypesdata',
        preserveNullAndEmptyArrays: true
      }
    },
    // Project the desired fields from both schemas
    {
      $project: {
        _id: '$event._id',
        UserId: {
          id: '$user._id',
          fullname: {
            $cond: [
              { $eq: ['$user.fullName', '$event.UserId.fullname'] },
              '$event.UserId.fullname',
              '$user.fullName'
            ]
          },
          email: '$user.email',
          profilePic: '$user.profilePic',
          follower: {
            $cond: [
              { $ifNull: ['$user.followers', false] },
              '$user.followers',
              []
            ]
          }
        }, 
        interest: {
          id:'$interestdata._id',
          interest:'$interestdata.interest',
          interestTypeId:'$interestdata.interestTypeId'

        },
        // interestType: {
        //   id: '$interestTypesdata._id',
        //   interestType: '$interestTypesdata.interestType'
        // },
        eventName: '$event.eventName',
        description: '$event.description',
        phoneNumber: '$event.phoneNumber',
        ticket: '$event.ticket',
        price: '$event.price',
        eventDate: '$event.eventDate',
        startTime: '$event.startTime',
        endTime: '$event.endTime',
        // interest: '$event.interest',
        interestType: '$event.interestType',
        venue:'$event.venue',
        online: '$event.online',
        longitude: '$event.longitude',
        latitude: '$event.latitude',
        file: '$event.file',
        discount: '$event.discount',
        discountVoucher: '$event.discountVoucher',
        likes: '$event.likes',
        status: '$event.status',
        totalBookedSeats: 1,
        totalPayAmount: 1,
        totalDiscountAmount: 1
      }
    }
  ]);
 // return commonHelper.handleResponse(res, 200, events, 'get');
  
 events = events.map(event => {
  event.totalSavedEvent = event?.likes ? event?.likes?.length : 0;
  event.totalFollower = event?.UserId?.follower ? event?.UserId?.follower?.length : 0;
  return event;
});

return events;

};


export default {
  reuseableInterestType,
  reuseableFeaturedEvent,
  reuseableRecommandation,
  reuseablePopular,
  filterEventDataByTimeFrame,
  reuseableEventData
};