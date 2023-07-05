import express from 'express';
import {

    createDiscount,
    updateDiscount,
    deleteDiscount,
    allDiscountVouncher,
    DiscountVouncher

} from '../controllers/discount.js';

const router = express.Router();


// create discount
router.post('/create', createDiscount);

// update discount
router.put('/update', updateDiscount);

// delete discount
router.delete('/delete', deleteDiscount);

// select all discount
router.get('/allDiscount', allDiscountVouncher);

// select single discount
router.get('/getdiscount', DiscountVouncher);


export default router;
