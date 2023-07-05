import express from 'express';
import {

    bookingEvent,
    discountCheck,
    addCalenderOrRemainder,
    getAllCalenderEvent,
    myBookingList

} from '../controllers/bookEvent.js';

const router = express.Router();

// router.get('/events', getAllEvents);

// Create a new event
router.post('/booking', bookingEvent);

router.put('/addCalenderOrRemainder', addCalenderOrRemainder);

router.get('/getAllCalenderEvent', getAllCalenderEvent);

router.get('/myBookingList', myBookingList);

// Discount check
router.get('/discountCheck', discountCheck);



export default router;
