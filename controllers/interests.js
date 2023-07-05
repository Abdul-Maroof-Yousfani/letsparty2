import interests from "../models/interests.js"
import interestTypes from "../models/interestTypes.js"
import { MongoUtil } from "../helpers/mongoUtils.js";
import commonHelper  from '../helpers/commonHelper.js';


const addInterests = async (req, res) => {
    try {
      let interest = req.body.interest.replace(/#\s*/g, "#");


      if (!interest.startsWith("#")) {
        interest = '#' + interest.replace(/#/g, ""); // Include '#' at the beginning and remove '#' if it is not at the start of the word
      }
      const interestTypeId = req.body.interestTypeId

      

      const existingInterestType = await interestTypes.findOne({ _id:interestTypeId, status: 1 }).lean();
      if (!existingInterestType) {
        return commonHelper.handleResponse(res, 409, 'interest Types', '');
      }

      const existingInterest = await interests.findOne({ interest, status: 1 });
  
      if (existingInterest) {
        return commonHelper.handleResponse(res, 409, null, 'exists');
      }
      if(!interest || interest == '#')
      {
        return commonHelper.handleResponse(res, 400, null, 'interest name is required');
        
      }
  
      const interestData = {
        interestTypeId: interestTypeId,
        interest: interest,
        status: 1,
      };
  
      const inserted = await interests(interestData).save();
  
      if (inserted) {
        const updated = await interests.find({ status: 1 }).lean();
        return commonHelper.handleResponse(res, 200, updated, 'create');
      } else {
        return commonHelper.handleResponse(res, 500, null, 'create', error);
      }
    } catch (error) {
      return commonHelper.handleResponse(res, 500, null, 'create', error);
    }
  };
  

  const getAllInterests = async (req, res) => {
    try {
      const interest = await interests.find({ status: 1 }).lean();
      if(!interest || interest.length === 0) {
        return commonHelper.handleResponse(res, 404, null, '');
      }
      commonHelper.handleResponse(res, 200, interest, 'select all');
    } catch (error) {
      commonHelper.handleResponse(res, 500, null, 'select all', error);
    }
  };
  

  const getInterestsById = async (req, res) => {
    try {
      const interest = await interests.findOne({ _id: req.params.id, status: 1 });
      if (!interest) {
        return commonHelper.handleResponse(res, 404, null, '');
      }
      commonHelper.handleResponse(res, 200, interest, 'select single');
    } catch (error) {
      commonHelper.handleResponse(res, 500, null, 'select single', error);
    }
  };
  
  
  const updateInterests = async (req, res) => {
    try {

      let interest = req.body.interest.replace(/#\s*/g, "#");
      const interestId =  req.body.id
      const interestTypeId = req.body.interestTypeId

      if (!interest.startsWith("#")) {
        interest = '#' + interest.replace(/#/g, ""); // Include '#' at the beginning and remove '#' if it is not at the start of the word
      }

      

      const existingInterestType = await interestTypes.findOne({ _id:interestTypeId, status: 1 }).lean();
      if (!existingInterestType) {
        return commonHelper.handleResponse(res, 409, 'interest Types', '');
      }

      if(!interest || interest == '#')
      {
        return commonHelper.handleResponse(res, 400, null, 'interest name is required');
        
      }
      
      const interestData = await interests.findOne({ _id:interestId,interestTypeId :interestTypeId , status: 1 }).lean();
      if (!interestData) {
        return commonHelper.handleResponse(res, 404, null, '');
      }

      const existingInterest = await interests.findOne({ interest, status: 1 }).lean();
      
      if (existingInterest) {
        return commonHelper.handleResponse(res, 409, null, 'exists');
      }

  
      await interests.findByIdAndUpdate({_id:interestId,interestTypeId :interestTypeId}, { $set: { interest: interest } });
      const updated = await interests.find({ status: 1 }).lean();
      commonHelper.handleResponse(res, 200, updated, 'update');
    } catch (error) {
      commonHelper.handleResponse(res, 500, null, 'update', error);
    }
  };
  
  
  const deleteInterests = async (req, res) => {
    try {
      const interestData = await interests.findOne({ _id: req.body.id, status: 1 }).lean();
      if (!interestData) {
        return commonHelper.handleResponse(res, 404, null, '');
      }
      await interests.findByIdAndUpdate({ _id: req.params.id }, { $set: { status: 2 } });
      const updated = await interests.find({ status: 1 }).lean();
      commonHelper.handleResponse(res, 200, updated, 'delete');
    } catch (error) {
      commonHelper.handleResponse(res, 500, null, 'delete', error);
    }
  };
  
  
  const getAllInterestsByInterestType = async (req, res) => {
    try {
      const interests = await interestTypes.aggregate([
        {
          $match: { status: 1 } // Filter documents with status = 1
        },
        {
          $lookup: {
            from: 'interests', // The name of the second collection
            localField: '_id', // The field in the first collection to join on
            foreignField: 'interestTypeId', // The field in the second collection to join on
            as: 'interests' // The name of the field to store the joined data
          }
        },
        {
          $project: { "interests.interestTypeId": 0, "interests.status": 0, "status": 0 }
        }
      ]);
      commonHelper.handleResponse(res, 200, interests, 'select all');
    } catch (error) {
      commonHelper.handleResponse(res, 500, null, 'select all', error);
    }
  };
  

export default {
    addInterests,
    getAllInterests,
    getInterestsById,
    updateInterests,
    deleteInterests,
    getAllInterestsByInterestType
}