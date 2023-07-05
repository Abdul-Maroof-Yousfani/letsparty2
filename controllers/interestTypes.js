import interestTypes from "../models/interestTypes.js"
import commonHelper from "../helpers/commonHelper.js";

const addInterestType = async (req, res) => {
  try {
    const interestType = req.body.interestType;
    const existingInterestType = await interestTypes.findOne({ interestType, status: 1 }).lean();
    if (existingInterestType) {
      return commonHelper.handleResponse(res, 409, null, 'exists');
    }

    if(!interestType)
      {
        return commonHelper.handleResponse(res, 400, null, 'interest Type name is required');
      }

    const interestTypeData = {
      interestType: interestType,
      status: 1
    };
    const inserted = await interestTypes(interestTypeData).save();
    if (inserted) {
      const updated = await interestTypes.find({ status: 1 }).lean();
      return commonHelper.handleResponse(res, 200, updated, 'create');
    } else {
      return commonHelper.handleResponse(res, 500, null, 'create');
    }
  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'create', error);
  }
}

const getAllInterestType = async (req, res) => {
  try {
    const interestType = await interestTypes.find({ status: 1 }).lean();
    return commonHelper.handleResponse(res, 200, interestType, 'select all');
  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'select all', error);
  }
}

const getInterestTypeById = async (req, res) => {
  try {
    const interestType = await interestTypes.findOne({ _id: req.params.id, status: 1 }).lean();
    if (!interestType) {
      return commonHelper.handleResponse(res, 404, null, '');
    }
    return commonHelper.handleResponse(res, 200, interestType, 'select single');
  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'select single', error);
  }
}

const updateInterestType = async (req, res) => {
  try {
    const interestType = req.body.interestType;
    const interestTypeId = req.body.id;

    const interestTypeData = await interestTypes.findOne({ _id:interestTypeId, status: 1 }).lean();
    if (!interestTypeData) {
      return commonHelper.handleResponse(res, 404, null, '');
    }

    if(!interestType)
      {
        return commonHelper.handleResponse(res, 400, null, 'interest Type name is required');
      }

    const existingInterestType = await interestTypes.findOne({ interestType, _id: { $ne: interestTypeId }, status: 1 }).lean();


    if (existingInterestType) {
      return commonHelper.handleResponse(res, 409, null, 'exists');
    }


    await interestTypes.findByIdAndUpdate(req.body.id, { $set: { interestType: interestType } });
    const updated = await interestTypes.find({ status: 1 }).lean();
    return commonHelper.handleResponse(res, 200, updated, 'update');
  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'update', error);
  }
}

const deleteInterestType = async (req, res) => {
  try {
    const id = req.params.id;
    const interestData = await interestTypes.findOne({ _id: id, status: 1 }).lean()
    if (!interestData) {
      return commonHelper.handleResponse(res, 404, null, '');
    }
    await interestTypes.findByIdAndUpdate({ _id: id }, { $set: { status: 2 } });
    const updated = await interestTypes.find({ status: 1 }).lean();
    return commonHelper.handleResponse(res, 200, updated, 'delete');
  } catch (error) {
    return commonHelper.handleResponse(res, 500, null, 'delete', error);
  }
}

export default {
  addInterestType,
  getAllInterestType,
  getInterestTypeById,
  updateInterestType,
  deleteInterestType
};
