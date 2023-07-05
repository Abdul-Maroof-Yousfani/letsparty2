import subscription from "../models/subscription.js";
import packages from "../models/packages.js";

const subscribeToPackage = async (req, res) => {
    try {
        if (req.body == undefined) {
            return res.status(200).json({
                status: 500,
                message: 'Something went wrong',
                data: []
            });
        }
        const userId = req.body.userId;
        const packageId = req.body.packageId;
        const paymentId = req.body.paymentId;
        const createdDate = req.body.createdDate;
        const userType = req.body.userType;

        const subscriptionExistes = await subscription.findOne({ userId: userId, userType: userType });
        if (subscriptionExistes) {
            return res.status(200).json({
                status: 409,
                message: 'You have already subscribed one package',
                data: []
            });
        }
        const packageData = await packages.findOne({ _id: packageId });
        let expiryTime = packageData.packageType;
        expiryTime = expiryTime.split(" ");

        var expiryDate = new Date(createdDate);
        expiryDate.setMonth(expiryDate.getMonth() + parseInt(expiryTime[0]));

        const subscriptionData = {
            userId: userId,
            packageId: packageId,
            paymentId: paymentId,
            userType: userType,
            createdDate: createdDate,
            expireAt: expiryDate,
            status: 1
        }
        const response = await subscription(subscriptionData).save();
        return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: response
        });
    } catch (error) {
        return res.status(200).json({
            status: 500,
            message: error.message,
            data: []
        });
    }
}

export default {
    subscribeToPackage
}