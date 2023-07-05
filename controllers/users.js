import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import users from "../models/users.js";
import subscription from "../models/subscription.js";
import emailHelper from "../helpers/emailHelper.js"
import commonHelper from "../helpers/commonHelper.js"
import mongoose from "mongoose";
import fs from "fs";
import { MongoUtil } from "../helpers/mongoUtils.js";

const register = async (req, res) => {
    try {
        const email = req.body.email;
        if (req.body == undefined) {
            return res.status(200).json({
                status: 400,
                message: 'Something went wrong',
                data: []
            });
        }
        const userExists = await users.findOne({ email });
        if (userExists) {
            return res.status(200).json({
                status: 403,
                message: 'User already exists',
                data: []
            });
        }
        const password = await bcrypt.hash(req.body.password, 10);
        const usersData = {
            fullName: req.body.fullName,
            email: email,
            password: password,
            dob: req.body.dob,
            phoneNo: req.body.phoneNo,
            status: 1
        };
        await users(usersData).save().then(async (response) => {
            const jwtToken = jwt.sign({ id: response._id, email: response.email }, process.env.JWT_TOKEN);
            await users.updateOne({ _id: response._id }, { $set: { jwtToken: jwtToken } }),
            response.password = undefined;
            response.jwtToken = jwtToken;
            return res.status(200).json({
                status: 200,
                message: 'Data retrieved successfully',
                data: response
            });
        }).catch(error => {
            return res.status(200).json({
                status: 500,
                message: error.message,
                data: []
            });
        });
    } catch (error) {
        return res.status(200).json({
            status: 500,
            message: error.message,
            data: []
        });
    }
}

const login = async (req, res) => {
    try {
        let { email, password } = req.body;
        const findUser = await users.findOne({ email }).lean();
        if (!findUser) {
            return res.status(200).json({
                status: 404,
                message: 'Username is invalid',
                data: []
            });
        }
        const dbUtils = MongoUtil.getInstance();
        const id = findUser._id;
        const isPassword = await bcrypt.compare(password, findUser.password);
        if (isPassword) {
            const jwtToken = jwt.sign({ id: findUser._id, email: findUser.email }, process.env.JWT_TOKEN);
            const updated = await users.findOneAndUpdate({ _id: id }, { $set: { jwtToken: jwtToken } });
            if (!updated) {
                return res.status(200).json({
                    status: 500,
                    message: 'Something went wrong',
                    data: []
                });
            }
            const userInfo = await users.findById(id).lean();
            userInfo.subscriptionData = await subscription.find({ userId: id }).select("packageId expireAt createdDate status").lean();

            userInfo.interests = await dbUtils.join(
                userInfo.interests,
                'interests',
                'interestId',
                '_id',
                {},
                {},
                {},
                {}).remove('interestId _id').value();

                userInfo.password = undefined;
            return res.status(200).json({
                status: 200,
                message: 'Login successfull',
                data: userInfo
            });
        } else {
            return res.status(200).json({
                status: 400,
                message: 'Password is incorrect',
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

const logout = async (req, res) => {
    try {
        if (req.params.id == undefined) {
            return res.status(200).json({
                status: 400,
                message: 'User is undefined',
                data: []
            });
        }
        const updated = await users.updateOne({ _id: req.params.id }, { $set: { onlineStatus: "Offline", jwtToken: "", fcmToken: "" } });
        if (updated) {
            return res.status(200).json({
                status: 200,
                message: 'Logged out successfully',
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

const updateUserProfile = async (req, res) => {
    try {
        if (req.body == undefined) {
            return res.status(200).json({
                status: 400,
                message: 'Something went wrong',
                data: []
            });
        }

        const id = req.body.id;
        const findUser = await users.findOne({ _id: id }).lean();
        if (!findUser) {
            return res.status(200).json({
                status: 404,
                message: 'User is undefinded',
                data: []
            });
        }

        if (req.files && req.files.profilePic) {
            console.log(req.files.profilePic);
            const profilePic = req.files.profilePic;
            if (findUser.profilePic !== "") {
                if (fs.existsSync(`./public${findUser.profilePic}`)) {
                    fs.unlinkSync(`./public${findUser.profilePic}`);
                }
            }
            const dir = "public/uploads/usersProfilePic";
            const imageName = `${dir}/${Date.now()}_${profilePic.name}`;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            try {
                await profilePic.mv(imageName);
            } catch (error) {
                return res.status(200).json({
                    status: 500,
                    message: error.message,
                    data: []
                });
            }
            const updatedPic = await users.updateOne(
                { _id: req.body.id },
                { $set: { profilePic: imageName.replace("public", "") } }
            );
            if (!updatedPic) {
                return res.status(200).json({
                    status: 500,
                    message: 'Failed to update profile picture',
                    data: []
                });
            }
        }

        const dbUtils = MongoUtil.getInstance();

        if (req.body.interests) {
            req.body.interests = JSON.parse(req.body.interests);
        }
        if (req.body.cards) {
            req.body.cards = JSON.parse(req.body.cards);
        }
        const updated = await users.updateOne({ _id: req.body.id }, { $set: req.body });
        if (!updated) {
            return res.status(200).json({
                status: 500,
                message: 'Something went wrong',
                data: []
            });
        }

        const userInfo = await users.findOne({ _id: id }).lean();
        userInfo.subscriptionData = await subscription.find({ userId: id }).select("packageId expireAt createdDate status").lean();

        userInfo.interests = await dbUtils.join(
            userInfo.interests,
            'interests',
            'interestId',
            '_id',
            {},
            {},
            {},
            {}).remove('interestId _id').value();

        userInfo.password = undefined;
        return res.status(200).json({
            status: 200,
            message: 'Profile updated successfully',
            data: userInfo
        });
    } catch (error) {
        return res.status(200).json({
            status: 500,
            message: error.message,
            data: []
        });
    }
}

const forgetPasswordOtp = async (req, res) => {
    try {
        const email = req.body.email;
        const user = await users.findOne({ email }).lean();
        if (!user) {
            return res.status(200).json({
                status: 404,
                message: 'invalid Email',
                data: []
            });
        }
        const randomNumber = Math.floor(100000 + Math.random() * 900000);
        //temp code
        users.findOneAndUpdate({ email: email },{ $set: { otpCode: randomNumber } }, { new: true },(error, response) => {
            console.log(response);
            if(error) {
                return res.status(200).json({
                    status: 400,
                    message: error.message,
                    data: []
                });
            }
            return res.status(200).json({
                status: 200,
                message: 'Otp generated successfully',
                data: {
                    email: response.email,
                    code: randomNumber
                }
            });
        });
    
        //end temp code
        
        // emailHelper.sendResetPasswordEmail(randomNumber, user.email, user.fullName, (error, response) => {
        //     if (error) {
        //         return res.json({
        //             status: 500,
        //             error: error.message
        //         });
        //     }
        //     const updated = users.updateOne({ email: email }, { $set: { otpCode: randomNumber } });
        //     if (updated) {
        //         return res.json({
        //             status: 200,
        //             message: {
        //                 email: user.email,
        //                 code: randomNumber
        //             }
        //         });
        //     } else {
        //         return res.json({
        //             status: 500,
        //             error: "Something went wrong"
        //         });
        //     }
        // });
    } catch (error) {
        return res.status(200).json({
            status: 500,
            message: error.message,
            data: []
        });
    }
}

const forgetPassword = async (req, res) => {
    try {
        const { email, password, otpCode } = req.body;
        const user = await users.findOne({ otpCode }).lean();
        if (!user) {
            return res.status(200).json({
                status: 404,
                message: 'Invalid OTP Code',
                data: []
            });
        }
        if (user.email !== email) {
            return res.status(200).json({
                status: 404,
                message: 'Invalid Email',
                data: []
            });
        }
        if (password == "") {
            return res.status(200).json({
                status: 401,
                message: 'Password is required',
                data: []
            });
        }
        const hashpassword = await bcrypt.hash(password, 10);

        const updated = await users.updateOne({ email: email }, { $set: { password: hashpassword, otpCode: '' } });
        if (updated) {
            return res.status(200).json({
                status: 200,
                message: 'Your password has been changed successfully',
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

const changePassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (password == "") {
            return res.status(200).json({
                status: 401,
                message: 'Password is required',
                data: []
            });
        }
        const hashpassword = await bcrypt.hash(password, 10);
        const findOne = await users.findOne({ email }).lean();
        if (!findOne) {
            return res.status(200).json({
                status: 404,
                message: 'Email is invalid',
                data: []
            });
        }
        const updated = await users.updateOne({ email: email }, { $set: { password: hashpassword } });
        if (updated) {
            return res.status(200).json({
                status: 200,
                message: 'Your password has been changed successfully',
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

const getUserProfileById = async (req, res) => {
    try {
        const id = req.params.id;
    
        const dbUtils = MongoUtil.getInstance();
        const userInfo = await users.findById(id).select("fullName profilePic onlineStatus interests").lean();

        userInfo.interests = await dbUtils.join(
            userInfo.interests,
            'interests',
            'interestId',
            '_id',
            {},
            {},
            {},
            {}, "interestData").remove('interestId _id').value();

        return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: userInfo
        });
    } catch (error) {
        return res.status(200).json({
            status: 500,
            message: error.message,
            data: []
        });
    }
}

const getLoggedInUserProfileById = async (req, res) => {
    try {
        const id = req.params.id;
        const dbUtils = MongoUtil.getInstance();
        const userInfo = await users.findById(id).lean();
        userInfo.subscriptionData = await subscription.find({ userId: id }).select("packageId expireAt createdDate status").lean();

        userInfo.interests = await dbUtils.join(
            userInfo.interests,
            'interests',
            'interestId',
            '_id',
            {},
            {},
            {},
            {}).remove('interestId _id').value();

        userInfo.password = undefined;
        return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: userInfo
        });
    } catch (error) {
        return res.status(200).json({
            status: 500,
            message: error.message,
            data: []
        });
    }
}

const deleteUserAccount = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await users.findOneAndDelete({ _id: id });
        if (deleted) {
            return res.status(200).json({
                status: 200,
                message: 'User successfully deleted',
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

const updateCards = async (req, res) => {
    try {
        if (req.body == undefined) {
            return res.status(200).json({
                status: 400,
                message: 'Something went wrong',
                data: []
            });
        }
        const { id, cardNumber, expiry, securityCode, name } = req.body;

        users.findOne({ _id: id }).exec(function (err, result) {
            if (result == null) {
                return res.status(200).json({
                    status: 404,
                    message: 'UserId is undefinded',
                    data: []
                });
            } else {
                result.cards.push({
                    cardNumber: cardNumber, expiry: expiry, securityCode: securityCode, name: name
                });
                result.save();
            }
        });
        const dbUtils = MongoUtil.getInstance();
        const userInfo = await users.findOne({ _id: id }).lean();
        userInfo.subscriptionData = await subscription.find({ userId: id }).select("packageId expireAt createdDate status").lean();

        userInfo.interests = await dbUtils.join(
            userInfo.interests,
            'interests',
            'interestId',
            '_id',
            {},
            {},
            {},
            {}).remove('interestId _id').value();

        userInfo.password = undefined;
        return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: userInfo
        });
    } catch (error) {
        return res.status(200).json({
            status: 500,
            message: error.message,
            data: []
        });
    }
}

const toggleFollow = async (req, res) => {
    try {
      const followerId = req.body.followerId;
      const userId = req.body.userId;
  
      if (followerId == userId) {
        return commonHelper.handleResponse(res, 400, null, 'You cannot follow yourself');
      }
  
      const user = await users.findOne({ _id: userId, status: 1 });
      if (!user) {
        return commonHelper.handleResponse(res, 404, null, '');
      }
  
      // Check if the followerId is already in the followers array
      if (followerId) {
        const existingIndex = user.followers.findIndex(
          (follower) => follower.userId && follower.userId.toString() === followerId.toString()
        );
  
        let action;
        if (existingIndex !== -1) {
          // Follower already exists, so remove the follower
          user.followers.splice(existingIndex, 1);
          action = 'unfollowed';
        } else {
          // Follower does not exist, so add the follower
          const followerUser = await users.findOne({ _id: followerId });
          if (!followerUser) {
            return commonHelper.handleResponse(res, 404, null, '');
          }
          const followerData = {
            userId: followerUser._id,
            name: followerUser.fullName,
            email: followerUser.email,
            profilePic: followerUser.profilePic,
          };
          user.followers.push(followerData);
          action = 'followed';
        }
  
        const updatedUser = await users.findOneAndUpdate(
          { _id: userId },
          { $set: { followers: user.followers } },
          { new: true }
        );
  
       return commonHelper.handleResponse(res, 200, { user: updatedUser, action }, 'update');
      } else {
        return commonHelper.handleResponse(res, 400, null, 'Follower ID is required');
      }
    } catch (error) {
        return  commonHelper.handleResponse(res, 500, null, 'update', error);
    }
  };
  
  
  const getFollowerList = async (req, res) => {
    try { 
      const userId = req.query.userId;

      const user = await users.findOne({ _id: userId, status: 1 });
      if (!user) {
        return commonHelper.handleResponse(res, 404, null, '');
      }

      return commonHelper.handleResponse(res, 200,user.followers , 'select all');


    } catch (error) {
        commonHelper.handleResponse(res, 500, null, 'select all', error);
      }
    };
    
export default {
    register,
    login,
    logout,
    updateUserProfile,
    forgetPasswordOtp,
    forgetPassword,
    changePassword,
    getUserProfileById,
    getLoggedInUserProfileById,
    deleteUserAccount,
    updateCards,
    toggleFollow,
    getFollowerList
}