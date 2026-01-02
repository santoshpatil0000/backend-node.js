import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    // 1. Validate userId
    // 2. Find totalVideos and videoViews from videos collection
    // 3. Find totalLikes on all channel from likes collection
    // 4. Find total subscriber from subscriptions collection
    // 5. Return result


    // Step 1: Validate userId
    const channelId = req.user?._id;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Step 2: Find totalVideos and videoViews from videos collection
    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
                isPublished: true
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ]);

    // Step 3: Find totalLikes on all channel from likes collection
    const totalLikes = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoData"
            }
        },
        { $unwind: "$videoData" },
        {
            $match: {
                "videoData.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "totalLikes"
        }
    ]);

    // Step 4: Find total subscriber from subscriptions collection
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    });

    // Step 5: Return result

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos: videoStats[0]?.totalVideos || 0,
                totalViews: videoStats[0]?.totalViews || 0,
                totalLikes: totalLikes[0]?.totalLikes || 0,
                totalSubscribers
            },
            "Channel stats fetched successfully"
        )
    );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    // 1. Validate userId
    // 2. Find totalVideos and totalCount on chennal from videos collection
    // 3. Return result


    // Step 1: Validate userId
    const channelId = req.user?._id;
    const { sortType = 'asc' } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Step 2: Find totalVideos and totalCount on chennal from videos collection
    const [videos, totalVideos] = await Promise.all([
        Video.find({ owner: channelId }),
        // .sort(sortType === "asc" ? 1 : -1),
        Video.countDocuments({ owner: channelId })
    ])

    // Step 3: Return result
    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {
                    videos,
                    totalVideos
                },
                "Chennal Videos fetched successfully"
            )
        )
})

export {
    getChannelStats,
    getChannelVideos
}