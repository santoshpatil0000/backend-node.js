import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    // 1. Build filter object based on query parameters
    // 2. Take page and limit for pagination usig .skip() and .limit() methods
    // 3. Sort based on sortBy and sortType parameters
    // 4. query param to search in title and description fields of video model
    // 5. if userId is provided in query param, filter videos by owner field matching the userId 

    // Add validations for query params as needed
    if (Number(page) < 1 || Number(limit) < 1) {
        throw new ApiError(400, "Invalid page or limit");
    }

    if (!page || !limit) {
        throw new ApiError(400, "Page and limit are required");
    }

    // Step 1: Build filter object
    let filter = {
        isPublished: true
    };

    // Step 2: Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Step 3: Sorting
    const sortOption = {
        [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1
    };

    /*
    // Step 4: Search query
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }
        */

    // Alternative Step 4: Search query using text index for better performance
    if (query) {
        filter.$text = { $search: query };
    }

    // Step 5: Filter by userId if provided
    if (userId) {
        filter.owner = userId;
    }

    const [videos, totalVideos] = await Promise.all([
        Video.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit))
            .populate("owner", "_id username email"), // populate owner field with username, email and _id only
        Video.countDocuments(filter)
    ]); 

    const totalPages = Math.ceil(totalVideos / limit);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    videos,
                    pagination: {
                        totalVideos,
                        totalPages,
                        currentPage: Number(page),
                        limit: Number(limit)
                    }
                },
                "Videos fetched successfully"
            ))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, duration, isPublished = true } = req.body
    // TODO: get video, upload to cloudinary, create video

    // 1. create videoLocalPath from req.file.path
    // 2. check if videoLocalPath exists else throw error
    // 3. upload video to cloudinary using uploadOnCloudinary utility function
    // 4. check if upload is successful else throw error
    // 5. create video document in DB with uploaded video url from cloudinary and other details
    // 6. return response with created video details

    // Validations
    if (!title || !description) {
        throw new ApiError(400, "Title and description fields are required")
    }

    if (!req.files?.videoFile || !req.files?.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required")
    }

    // Step 1: Get video local path from req.file.path
    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    // Step 2: Check if videoLocalPath exists
    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail are required")
    }

    // Step 3: Upload video and thumbnail to cloudinary
    const uploadVideoResult = await uploadOnCloudinary(videoLocalPath)
    const uploadThumbnailResult = await uploadOnCloudinary(thumbnailLocalPath)

    // Step 4: Check if upload is successful
    if (!uploadVideoResult || !uploadThumbnailResult) {
        throw new ApiError(500, "Failed to upload video or thumbnail to cloudinary")
    }

    // step 5. Auto-duration extraction from cloudinary response
    const videoDuration = Math.round(uploadVideoResult.duration || duration || 0)   // in seconds

    // Step 6: Create video document in DB with uploaded video url from cloudinary and other details
    const video = await Video.create({
        title,
        description,
        duration: videoDuration,
        isPublished,
        owner: req.user._id,
        videoFile: uploadVideoResult.url,
        thumbnail: uploadThumbnailResult.url
    })

    // Step 6: Return response with created video details
    return res.status(201).json(
        new ApiResponse(
            201,
            { video },
            "Video published successfully"
        )
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId, increaseViews = true } = req.params
    //TODO: get video by id

    // 1. validate videoId
    // 2. find video by id from DB
    // 3. if increaseViews is true, increment views count by 1
    // 4. return response with video details

    // Step 1: Validate videoId
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 2: Find video by id from DB
    const video = await Video.findByIdAndUpdate(
        videoId,
        increaseViews ? { $inc: { views: 1 } } : {}, // Step 3: Increment views count by 1 if increaseViews is true
        { new: true } // return the updated document
    ).populate("owner", "_id username email") // populate owner field with username, email and _id only

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video fetched successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description, isPublished } = req.body
    //TODO: update video details like title, description, thumbnail

    // 1. validate videoId
    // 2. validate updating fields(title, description, isPublished) by same owner of the video or not
    // 3. find video by id from DB and update
    // 4. return response with updated video details

    // Step 1: Validate videoId
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    if (!title || !description || typeof isPublished === "undefined") {
        throw new ApiError(400, "Title, description and isPublished fields are required")
    }

    // Step 2: Validate updating fields by same owner of the video or not
    const existingVideo = await Video.findById(videoId)
    if (!existingVideo) {
        throw new ApiError(404, "Video not found")
    }

    // Check if the requesting user is the owner of the video
    if (existingVideo.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    // Step 3: Update video by id from DB
    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                isPublished
            }
        },
        { new: true } // return the updated document
    )

    if (!updateVideo) {
        throw new ApiError(404, "Video is not updated. Please try again.")
    }

    // Step 4: Return response with updated video details
    return res.status(200).json(
        new ApiResponse(
            200,
            updateVideo,
            "Video updated successfully"
        )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    // 1. validate videoId
    // 2. find video by id from DB and delete
    // 3. return response with deleted video details

    // Step 1: Validate videoId
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 2: Find video by id from DB and delete
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Check if the requesting user is the owner of the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video")
    }

    // Step 3: Find video by id from DB and delete
    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(404, "Video is not deleted. Please try again.")
    }

    // Step 3: Return response with deleted video details
    return res.status(200).json(
        new ApiResponse(
            200,
            deletedVideo,
            "Video deleted successfully"
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // 1. validate videoId
    // 2. find video by id from DB
    // 3. authorization check - only owner can toggle publish status
    // 4. toggle isPublished status
    // 5. return response with updated video details

    // Step 1: Validate videoId
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 2: Find video by id from DB
    const existingVideo = await Video.findById(videoId);
    if (!existingVideo) {
        throw new ApiError(404, "Video not found")
    }

    // Step 3: Authorization check - only owner can toggle publish status
    if (existingVideo.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to toggle publish status of this video")
    }

    /*
    // Step 4: Toggle isPublished status
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !existingVideo.isPublished
            }
        },
        { new: true }
    )

    if (!updatedVideo) {
        throw new ApiError(404, "Video is not updated. Please try again.")
    }
*/

    // Alternative Step 4: Toggle isPublished status and save
    existingVideo.isPublished = !existingVideo.isPublished
    const updatedVideo = await existingVideo.save({ validateBeforeSave: false }) // skip validation before save for faster operation

    // Step 5: Return response with updated video details
    return res.status(200).json(
        new ApiResponse(
            200,
            updatedVideo,
            "Video publish status toggled successfully"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
