import express from 'express';
import {
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
} from '../controllers/event.js';

const router = express.Router();

// home screen api route

router.get('/Home', getAllEventsAtHome);

router.get('/viewAllCategory', viewAllcategories);

router.get('/viewAllfeaturedEvent', viewAllfeaturedEvent);

router.get('/viewAllRecommadationEvent', viewAllRecommadationEvent);

router.get('/viewAllPopularEvent', viewAllPopularEvent);

router.get('/searchEventByName', searchEventByName);

router.get('/getUserSavedEvents', getUserLikesEvents);



// router.get('/events', getAllEvents);

// Create a new event
router.post('/create', createEvent);

// Get all events
router.get('/all', getAllEvents);

// Get a specific event by ID
router.get('/:id', getEventById);

// Update an event
router.put('/updateEvent', updateEvent);

// Delete an event
router.delete('/:id', deleteEvent);

// Add a like to an event
router.put('/saved', toggleLike);

// Get all events


export default router;
