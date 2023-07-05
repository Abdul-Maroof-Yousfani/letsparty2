import express from "express";
import users from "../controllers/users.js";
import tokenValidation from "../validation/tokenValidation.js";
const router = express.Router();

router.post("/register", users.register);
router.post("/login", users.login);
router.put("/logout/:id", tokenValidation, users.logout);
router.put("/updateUserProfile", tokenValidation, users.updateUserProfile);
router.put("/forgetPasswordOtp", users.forgetPasswordOtp);
router.put("/forgetPassword", users.forgetPassword);
router.put("/toggleFollow", users.toggleFollow);
router.get("/myfollowers", users.getFollowerList);
router.put("/changePassword", tokenValidation, users.changePassword);
router.get("/getUserProfileById/:id", tokenValidation, users.getUserProfileById);
router.get("/getLoggedInUserProfileById/:id", tokenValidation, users.getLoggedInUserProfileById);
router.delete("/deleteUserAccount/:id", tokenValidation, users.deleteUserAccount);
router.put("/updateCards", tokenValidation, users.updateCards);
export default router; 