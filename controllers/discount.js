import Event from '../models/event.js';
import commonHelper from '../helpers/commonHelper.js';
import mongoose from 'mongoose';

const createDiscount = async (req, res) => {
    try {
      const eventID = req.body.eventID;
      const userID = req.body.userID;
      const discountData = JSON.parse(req.body.discountData); // Assuming discount data is provided in the request body
  
      const existingEvent = await Event.findOne({ _id: eventID, userID: userID, status: 1 });
  
      if (!existingEvent) {
        return commonHelper.handleResponse(res, 404, null, '');
      }
  
      // Check if the discountName already exists in the discountVouncher array
      const existingDiscount = existingEvent.discountVouncher.find(discount => discount.discountName === discountData.discountName);
      if (existingDiscount) {
        return commonHelper.handleResponse(res, 400, null, 'Discount with the same name already exists');
      }
  
      // Create a new discount voucher object
      const newDiscount = {
        discountName: discountData.discountName,
        discountAmount: discountData.discountAmount,
        discountPercentage: discountData.discountPercentage,
        tickets: discountData.tickets,
        startDate: discountData.startDate,
        endDate: discountData.endDate
      };
  
      // Add the new discount voucher to the existing event's discountVouncher array
      existingEvent.discountVouncher.push(newDiscount);
  
      // Save the updated event document
     await existingEvent.save();
  
      return commonHelper.handleResponse(res, 200, existingEvent, 'create');
    } catch (error) {
      commonHelper.handleResponse(res, 500, null, 'update', error);
  
    }
  };

  const updateDiscount = async (req, res) => {
    try {
      const eventID = req.body.eventID;
      const userID = req.body.userID;
      const discountID = req.body.discountID; // Assuming the discount ID is provided in the request body
      const discountData = JSON.parse(req.body.discountData); // Assuming discount data is provided in the request body
  
      const existingEvent = await Event.findOne({ _id: eventID, userID: userID, status: 1 });
  
      if (!existingEvent) {
        return commonHelper.handleResponse(res, 404, null, 'Event not found');
      }
  
      // Find the discount voucher in the discountVouncher array
      const discountIndex = existingEvent.discountVouncher.findIndex(discount => discount._id.toString() === discountID);
  
      if (discountIndex === -1) {
        return commonHelper.handleResponse(res, 404, null, 'Discount voucher not found');
      }
  
      // Check if the discountName already exists in the discountVouncher array
      const existingDiscount = existingEvent.discountVouncher.find(discount => discount.discountName === discountData.discountName);
      if (existingDiscount && existingDiscount._id.toString() !== discountID) {
        return commonHelper.handleResponse(res, 400, null, 'Discount with the same name already exists');
      }
  
      // Update the discount voucher with the new data
      existingEvent.discountVouncher[discountIndex].discountName = discountData.discountName;
      existingEvent.discountVouncher[discountIndex].discountAmount = discountData.discountAmount;
      existingEvent.discountVouncher[discountIndex].discountPercentage = discountData.discountPercentage;
      existingEvent.discountVouncher[discountIndex].tickets = discountData.tickets;
      existingEvent.discountVouncher[discountIndex].startDate = discountData.startDate;
      existingEvent.discountVouncher[discountIndex].endDate = discountData.endDate;
  
      // Save the updated event document
      await existingEvent.save();
  
      return commonHelper.handleResponse(res, 200, existingEvent, 'update');
    } catch (error) {
        commonHelper.handleResponse(res, 500, null, 'update', error);
    }
  };
  
  
  const deleteDiscount = async (req, res) => {
    try {
      const eventID = req.body.eventID;
      const userID = req.body.userID;
      const discountID = req.body.discountID; // Assuming the discount ID is provided in the request body
  
      const existingEvent = await Event.findOne({ _id: eventID, userID: userID, status: 1 });
  
      if (!existingEvent) {
        return commonHelper.handleResponse(res, 404, null, 'Event not found');
      }
  
      // Find the discount voucher in the discountVouncher array
      const discountIndex = existingEvent.discountVouncher.findIndex(discount => discount._id.toString() === discountID);
  
      if (discountIndex === -1) {
        return commonHelper.handleResponse(res, 404, 'Discount', '');
      }
  
      // Remove the discount voucher from the discountVouncher array
      existingEvent.discountVouncher.splice(discountIndex, 1);
  
      // Save the updated event document
      await existingEvent.save();
  
      return commonHelper.handleResponse(res, 200, existingEvent, 'delete');
    } catch (error) {
      return commonHelper.handleResponse(res, 500, null, 'Error in deleting discount voucher', error);
    }
  };

  const allDiscountVouncher = async (req, res) => {
    try {
      const UserId = req.query.userID;
      if (!UserId) {
        return commonHelper.handleResponse(res, 400, null, 'userID is required');
      }
  
      const events = await Event.find({ UserId, status: 1 }).lean();
      if (!events || events.length === 0) {
        return commonHelper.handleResponse(res, 404, 'Event', '');
      }
  

      const filteredEvents = events
                              .filter(event => event.UserId == UserId && event.status === 1 && event.discountVouncher.length !== 0)
                              .map(event => {
                                const eventID = event._id;
                                const discountVouchers = event.discountVouncher;
                                const eventName = event.eventName;

                                return {
                                  // event,
                                  eventID,
                                  eventName,
                                  discountVouchers
                                };
                              });

  
      commonHelper.handleResponse(res, 200, filteredEvents, 'select all');
    } catch (error) {
      commonHelper.handleResponse(res, 500, null, 'select all', error);
    }
  };
  
  
  const DiscountVouncher = async (req, res) => {
    try {
      const UserId = req.query.userID;
      const eventID = req.query.eventID;
      const discountVoucherID = req.query.discountID;
  
      if (!UserId || !eventID || !discountVoucherID) {
        return commonHelper.handleResponse(res, 400, null, 'All params are required');
      }
  
      const event = await Event.findOne({
        _id: eventID,
        UserId,
        status: 1,
        'discountVouncher._id': discountVoucherID
      }).lean();
  
      if (!event) {
        return commonHelper.handleResponse(res, 404, 'Event', '');
      }
  
      const filteredEvents = {
        eventID: event._id,
        eventName: event.eventName,
        discountVouchers: event.discountVouncher.filter(voucher => voucher._id.toString() === discountVoucherID)
      };
      
  
      commonHelper.handleResponse(res, 200, filteredEvents, 'Select single');
    } catch (error) {
      commonHelper.handleResponse(res, 500, null, 'Select single', error);
    }
  };
  

  export {
    createDiscount,
    deleteDiscount,
    updateDiscount,
    allDiscountVouncher,
    DiscountVouncher
  };
  