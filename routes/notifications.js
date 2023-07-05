import express from "express";
import notifications from "../controllers/notifications.js";
const router = express.Router();

router.put('/updateUserFcmToken', notifications.updateUserFcmToken);
router.get('/getUserNotifications/:userId', notifications.getUserNotifications);
router.put('/updateNotificationReadStatus/:notificationId', notifications.updateNotificationReadStatus);
export default router;