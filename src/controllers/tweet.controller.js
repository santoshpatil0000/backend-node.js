import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    // 1. Fetch content from req.body and userId from req.user(populated by verifyJWT middleware)
    // 2. Validate content (e.g., not empty, length limit)
    // 3. Create new Tweet document and save to DB
    // 4. Return success response with created tweet data

    // Step 1: Fetch content and userId
    const { content } = req.body;
    const userId = req.user._id;

    // Step 2: Validate content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content cannot be empty");
    }

    if (content.length > 280) {
        throw new ApiError(400, "Tweet content exceeds maximum length of 280 characters");
    }

    // Step 3: Create new Tweet document and save to DB
    const tweet = await Tweet.create({
        content,
        owner: userId
    });

    // Step 4: Return success response with created tweet data
    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    // 1. Fetch userId from req.params
    // 2. Validate userId
    // 3. Query Tweet collection for tweets with owner = userId
    // 4. Return success response with list of tweets

    // Step 1: Fetch userId from req.params
    const { userId } = req.params;

    // Step 2: Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Step 3: Query Tweet collection for tweets with owner = userId
    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

    // Step 4: Return success response with list of tweets
    return res.status(200).json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    // 1. Fetch tweetId from req.params and content from req.body
    // 2. Validate tweetId and content
    // 3. Find tweet by tweetId and update content
    // 4. Return success response with updated tweet data

    // Step 1: Fetch tweetId and content
    const { tweetId } = req.params;
    const { content } = req.body;

    // Step 2: Validate tweetId and content
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content cannot be empty");
    }

    if (content.length > 280) {
        throw new ApiError(400, "Tweet content exceeds maximum length of 280 characters");
    }

    // Step 3: Find tweet by tweetId and update content
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    tweet.content = content;
    await tweet.save();

    // Step 4: Return success response with updated tweet data
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    // 1. Fetch tweetId from req.params
    // 2. Validate tweetId
    // 3. Find tweet by tweetId and delete
    // 4. Return success response

    // Step 1: Fetch tweetId from req.params
    const { tweetId } = req.params;

    // Step 2: Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    // Step 3: Find tweet by tweetId and delete
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    await tweet.deleteOne();

    // Step 4: Return success response
    return res.status(200).json(new ApiResponse(200, null, "Tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
