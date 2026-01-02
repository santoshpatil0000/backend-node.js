import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    // 1. Validate videoId
    // 2. Check if like already exists for this user and video
    // 3. If exists, remove the like (unlike)
    // 4. If not exists, create a new like
    // 5. Return appropriate response

    // Step 1: Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    // Step 2: Check if like already exists for this user and video
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    // Step 3: If exists, delete the like (unlike)
    if (existingLike) {
        await existingLike.deleteOne();
        return res.json(new ApiResponse(200, existingLike, "Video unliked successfully"));
    }

    // Step 4: If not exists, create a new like
    const newLike = await Like.create({
        video: videoId,
        likedBy: req.user._id
    });

    // Step 5: Return appropriate response
    return res.json(new ApiResponse(201, { likeId: newLike._id }, "Video liked successfully"));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    // 1. Validate commentId
    // 2. Check if like already exists for this user and comment
    // 3. If exists, remove the like (unlike)
    // 4. If not exists, create a new like
    // 5. Return appropriate response

    // Step 1: Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    // Step 2: Check if like already exists for this user and comment
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    // Step 3: If exists, delete the like (unlike)
    if (existingLike) {
        await existingLike.deleteOne();
        return res.json(new ApiResponse(200, existingLike, "Comment unliked successfully"));
    }

    // Step 4: If not exists, create a new like
    const newLike = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    });

    // Step 5: Return appropriate response
    return res.json(new ApiResponse(201, { likeId: newLike._id }, "Comment liked successfully"));

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    // 1. Validate tweetId
    // 2. Check if like already exists for this user and tweet
    // 3. If exists, remove the like (unlike)
    // 4. If not exists, create a new like
    // 5. Return appropriate response

    // Step 1: Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    // Step 2: Check if like already exists for this user and tweet
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });

    // Step 3: If exists, delete the like (unlike)
    if (existingLike) {
        await existingLike.deleteOne();
        return res.json(new ApiResponse(200, existingLike, "Tweet unliked successfully"));
    }

    // Step 4: If not exists, create a new like
    const newLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    });

    // Step 5: Return appropriate response
    return res.json(new ApiResponse(201, { likeId: newLike._id }, "Tweet liked successfully"));
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    // 1. Fetch all likes by the user where video field is not null
    // 2. Populate the video details
    // 3. Return the list of liked videos

    // Step 1: Fetch all likes by the user where video field is not null
    const likedVideos = await Like.find({
        likedBy: req.user._id,
        video: { $ne: null }
    })
    // .populate({
        // path: "video",
        // populate: {
        //     path: "owner",
        //     select: "username avatar"
        // }
    // })

    // Step 2: Populate the video details
    .populate("video").exec();

    // Step 3: Return the list of liked videos
    return res.json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}