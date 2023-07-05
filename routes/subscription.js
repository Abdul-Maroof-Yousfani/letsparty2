import express from "express";
import subscription from "../controllers/subscription.js";
import tokenValidation from "../validation/tokenValidation.js";
const router = express.Router();

router.post("/subscribeToPackage", tokenValidation, subscription.subscribeToPackage);
export default router;