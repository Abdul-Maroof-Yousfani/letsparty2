import express from "express";
import interestTypes from "../controllers/interestTypes.js";
import tokenValidation from "../validation/tokenValidation.js";
const router = express.Router();

router.post("/addInterestType", tokenValidation, interestTypes.addInterestType);
router.get("/getAllInterestType", tokenValidation, interestTypes.getAllInterestType);
router.get("/getInterestTypeById/:id", tokenValidation, interestTypes.getInterestTypeById);
router.put("/updateInterestType", tokenValidation, interestTypes.updateInterestType);
router.delete("/deleteInterestType/:id", tokenValidation, interestTypes.deleteInterestType);
export default router;