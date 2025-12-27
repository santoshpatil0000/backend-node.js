import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

/* "generateAccessAndRefereshTokens" function to generate new access and refresh tokens for a user(whenever needed call this function) */
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()      // use the custom instance method("generateAccessToken") defined in user model to generate access token for the user instance
        const refreshToken = user.generateRefreshToken()    // use the custom instance method("generateRefreshToken") defined in user model to generate refresh token for the user instance

        user.refreshToken = refreshToken                    // store the generated refresh token in user document's refreshToken field in DB for session management
        await user.save({ validateBeforeSave: false })      // save the user document with updated refresh token field in DB without running any validation checks on other fields(like required fields, etc. defined in user model schema) -> "validateBeforeSave: false" will skip those validation checks

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    /*
    return res.status(200).json({
        message: "Register User endpoint is working fine"
    })
    */


    const { fullName, email, username, password } = req.body
    // console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")     // check if any field is empty string after trimming
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {                                                                  // check if user with same username or email already exists
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;                                 // get the local path of uploaded avatar file from multer middleware(../../public/temp/xyz.jpg)
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)                  // upload avatar image to cloudinary and get the uploaded image details (like url, public_id, etc.)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)          // upload cover image to cloudinary and get the uploaded image details (like url, public_id, etc.)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }


    // create user entry in the database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",                  // if cover image is not uploaded, set it to empty string(optional field in user model-not required)
        email,
        password,
        username: username.toLowerCase()
    })

    // check if user is created successfully in DB(_id is created by default by mongoose for each document/entry)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"                           // remove password and refresh token field from response using mongoose select method
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // every created document/entry will give default created fields in return ( e.g: in "createdUser")
    return res.status(201).json(            // stsatus code 201 will be shown in postman for successful creation of resource
        new ApiResponse(200, createdUser, "User registered Successfully")   // custom api response structure to FE
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> fetch data
    // username or email
    // find the user
    // password check
    // password failed in checking -> error
    // password matches -> generate access and refresh token and send to user in secure http only cookie
    // send cookie
    // send success response

    const { email, username, password } = req.body
    console.log(email, username, password);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
    // }

    if (!password || password?.trim() === "") {
        throw new ApiError(400, "password is required")
    }

    const user = await User.findOne({   // "user" will be having all custom instance methods defined in user model as well along with user document fields stored in DB
        $or: [{ username }, { email }]  // find user by username or email
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)   // use the custom instance method("isPasswordCorrect") defined in user model to compare passwords(password -> from req body, user.password -> compared with stored hashed password in DB)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")    // remove password and refresh token field from response using mongoose select method

    // above "loggedInUser" can also be created without making DB call,
    /* 
    const loggedInUser = {
        ...user,
        password: "",
        refreshToken: ""
    }
    */

    const options = {       // by setting httpOnly: true and secure: true, the cookie cannot be modified via client-side(FE) and will only be modified via server-side(BE) and will be sent only over HTTP connection for security purpose
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)            // .cookie("key", "value", options) -> is set in app.use(cookieParser()) middleware in app.js
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    // since we dont have "user._id" access in "logoutUser" controller, we will inject custom middleware(auth.middleware.js) "verifyJWT" in the route to verify access token and get user details from token and set it in req.user
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true           // returns the updated document(with refreshToken field removed) after update operation
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

/* "refreshAccessToken" is needed when accessToken expires, FE calls one endpoint(without throwing error to the user to login again) to refresh the token(both) if refresh token is still valid */
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken  // get refresh token from cookie or req body from FE

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(                // verify the incoming refresh token with refreshTokenSecret key used while signing the token with jwt.verify
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")

        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body



    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        { new: true }

    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image updated successfully")
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )
})


const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}