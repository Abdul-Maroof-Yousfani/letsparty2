import notifications from "../models/notifications.js";
import users from "../models/users.js";

const updateUserFcmToken = async (req, res) => {
    try {
        const updated = await users.updateOne({ _id: req.body.id }, { $set: { fcmToken: req.body.fcmToken } });
        if (updated) {
            return res.status(200).json({
                status: 200,
                message: 'Successfully updated',
                data: []
            });
        } else {
            return res.status(200).json({
                status: 500,
                message: 'Something went wrong',
                data: []
            });
        }
    } catch (error) {
        return res.status(200).json({
            status: 500,
            message: error.message,
            data: []
        });
    }
}

const getUserNotifications = async (req, res) => {
    try {
        let notification = await notifications.find({ userId: req.params.userId }).sort({ date: -1 }).lean();
        notification = await Promise.all(notification.map(async (notify) => {
            notify.data = await Promise.all(notify.data.map(async (data) => {
                data.senderId = await users.findById(data.senderId).select("fullName username profilePic onlineStatus status").exec();
                return data;
            }));
            return notify;
        }));
        return res.status(200).json({
            status: 200,
            message: 'Notifications retrieved successfully',
            data: notification
        });
    } catch (error) {
        return res.status(200).json({
            status: 500,
            message: error.message,
            data: []
        });
    }
}

const updateNotificationReadStatus = async (req, res) => {
    try {
        if (req.params.notificationId == undefined) {
            return res.status(200).json({
                status: 500,
                message: 'Something went wrong',
                data: []
            });
        }
        const updated = await notifications.updateOne({ _id: req.params.notificationId }, { $set: { readStatus: 1 } });
        if (updated) {
            return res.status(200).json({
                status: 200,
                message: 'Successfully updated',
                data: []
            });
        } else {
            return res.status(200).json({
                status: 500,
                message: 'Something went wrong',
                data: []
            });
        }
    } catch (error) {
        return res.status(200).json({
            status: 500,
            message: error.message,
            data: []
        });
    }
}

export default {
    updateUserFcmToken,
    getUserNotifications,
    updateNotificationReadStatus
}