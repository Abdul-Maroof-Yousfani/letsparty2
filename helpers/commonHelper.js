import notifications from "../models/notifications.js";
import mongoose from "mongoose";
import FCM from "fcm-node"
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

const uploadFile = async (file, directoryPath, existingPath) => {
  try {
    if (!file) {
      throw new Error('No file found');
    }

    if (existingPath !== '') {
      if (fs.existsSync(existingPath)) {
        fs.unlinkSync(existingPath);
      }
    }

    const fileExtension = path.extname(file.name).toLowerCase();
    const fileType = mime.lookup(fileExtension);
    let fileTypeValue = '';

    if (fileType) {
      if (fileType.startsWith('image')) {
        // File is an image
        // Process accordingly
        directoryPath = path.join(directoryPath, 'images');
        fileTypeValue = 'image';
      } else if (fileType.startsWith('video')) {
        // File is a video
        directoryPath = path.join(directoryPath, 'videos');
        fileTypeValue = 'video';
      } else {
        // Invalid file type
        throw new Error('Invalid file type. Only image or video files are allowed.');
      }

      fs.mkdirSync(directoryPath, { recursive: true });
    }

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = path.join(directoryPath, fileName);

    await file.mv(filePath);

    return {
      message: true,
      data: filePath
    };
  } catch (error) {
    throw error;
  }
};





function distance(lat1, lon1, lat2, lon2) {
  if ((lat1 == lat2) && (lon1 == lon2)) {
    return 0;
  }
  else {
    var radlat1 = Math.PI * lat1 / 180;
    var radlat2 = Math.PI * lat2 / 180;
    var theta = lon1 - lon2;
    var radtheta = Math.PI * theta / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344;
    return dist;
  }
}

function notificationHelper(fcmToken, title, body, data, payloadData, daterId) {
  var fcm = new FCM(process.env.FCM_KEY);
  var message = {
    to: fcmToken,
    collapse_key: 'your_collapse_key',

    notification: {
      title: title,
      body: body
    },
    data: data
  };

  notifications.create({
    daterId: daterId,
    title: title,
    body: body,
    data: payloadData,
    readStatus: 0
  });

  fcm.send(message, function (err, response) {
    if (err) {
      console.log("Something has gone wrong!");
    } else {
      console.log("Successfully sent with response: ", response);
    }
  });
}

function getAge(dateString) {
  var today = new Date();
  var birthDate = new Date(dateString);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function addActivity(daterId, activityByDaterId, text) {
  const activityData = {
    daterId: daterId,
    activity: [{ activityByDaterId: mongoose.Types.ObjectId(activityByDaterId), text: text }]
  }
  activities.findOne({ daterId: daterId }).exec(function (err, result) {
    if (result == null) {
      activities(activityData).save().then(async (response) => { });
    } else {
      let findDaterActivityList = result.activity.findIndex(x => x.activityByDaterId == activityByDaterId && x.text == text);
      if (findDaterActivityList == -1) {
        result.activity.push({
          activityByDaterId: mongoose.Types.ObjectId(activityByDaterId),
          text: text
        });
      } else {
        result.activity[findDaterActivityList] = {
          activityByDaterId: mongoose.Types.ObjectId(activityByDaterId),
          text: text
        }
      }
      result.save();
    }
  });
}

function pagination(page, limit, records) {
  const results = {};
  limit = limit == 0 ? 5 : limit;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  if (endIndex < records.length) {
    results.next = {
      page: page + 1,
      limit: limit
    }
  }
  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit
    }
  }
  results.totalPages = {
    page: Math.ceil(records.length / limit),
    limit: limit,
    totalRecords: records.length
  };
  results.result = records.slice(startIndex, endIndex);
  return results;
}

const handleResponse = (res, status, data, operation, error = null) => {
  let message = '';
  switch (operation) {
    case 'create':
      message = 'Record created successfully';
      break;
    case 'update':
      message = 'Record updated successfully';
      break;
    case 'delete':
      message = 'Record deleted successfully';
      break;
    case 'select all':
      message = 'Records retrieved successfully';
      break;
    case 'select single':
      message = 'Record retrieved successfully';
      break;
    case 'exists':
      message = 'Record already exists';
      break;
    case '':
      message = data + ' Record not found';
      data = null;
      break;
    default:
      message = operation;
  }

  if (error) {
    // Modify the error message based on the operation type
    message = error.message;
  }

  try {
    res.status(200).json({ status, message, data });
  } catch (error) {
    res.status(200).json({ status: 500, message: 'An error occurred', data: null });
  }
};


const joinDocuments = async (collection1, collection2, localField, foreignField, as) => {
  try {
    const result = await collection1.aggregate([
      {
        $lookup: {
          from: collection2.collectionName,
          localField,
          foreignField,
          as,
        },
      },
    ]).toArray();

    return result;
  } catch (error) {
    // Handle error
    console.error(error);
    throw error;
  }
};


function filter(followerId, distance, lat, long, events) {
  // Filter events based on the provided radius
  let data = events.filter(event => {
    // Check distance using the Haversine formula
    if (lat && long) {
      const earthRadius = 6371; // Earth's radius in kilometers
      const distanceThreshold = distance / 1000; // Convert meters to kilometers

      const dLat = toRad(event.latitude - lat);
      const dLong = toRad(event.longitude - long);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat)) * Math.cos(toRad(event.latitude)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const eventDistance = earthRadius * c;

      if (eventDistance > distanceThreshold) {
        return false;
      }
      else {
        return true;
      }
    }
    else {
      return true;
    }

  });

  let filteredData;

  if (followerId) {
    filteredData = data.filter(event =>
      event?.UserId?.follower?.some(follower => follower.userId == followerId)
    );
  }
   else {
    filteredData = data.filter(event =>
      event.venue === 'public'
    );
  }

  if (filteredData.length === 0) {
    filteredData = data.filter(event =>
      event.venue === 'public'
    );
  }

  return filteredData; //[category,price, data];
}


// Helper function to convert degrees to radians
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}







export default {
  distance,
  notificationHelper,
  getAge,
  addActivity,
  pagination,
  uploadFile,
  handleResponse,
  joinDocuments,
  filter
}