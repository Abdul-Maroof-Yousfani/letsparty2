import express from "express";
import interests from "../controllers/interests.js";
import tokenValidation from "../validation/tokenValidation.js";
const router = express.Router();

router.post("/addInterests", tokenValidation, interests.addInterests);
router.get("/getAllInterests", tokenValidation, interests.getAllInterests);
router.get("/getInterestsById/:id", tokenValidation, interests.getInterestsById);
router.put("/updateInterests", tokenValidation, interests.updateInterests);
router.delete("/deleteInterests/:id", tokenValidation, interests.deleteInterests);
router.get("/getAllInterestsByInterestType", tokenValidation, interests.getAllInterestsByInterestType);
export default router;