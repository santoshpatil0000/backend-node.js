import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    // 1. Validate videoId
    // 2. Fetch comments for the video with pagination 
    // 3. Validate page and limit
    // 4. Return comments along with pagination info

    // Step 1: Validate videoId
    if (!mongoose.isValidObjectId(videoId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    // Step 3: Validate page and limit
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber < 1) {
        throw new ApiError(400, "Invalid page number");
    }

    if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        throw new ApiError(400, "Invalid limit number. It should be between 1 and 100");
    }

    // Step 2: Fetch comments for the video with pagination
    const skip = (pageNumber - 1) * limitNumber;
    const [comments, totalComments] = await Promise.all([
        Comment.find({ video: videoId })
            .sort({ createdAt: -1 }) // sort by newest first
            .skip(skip)
            .limit(limitNumber)
            .populate("owner", "_id username email"), // populate commentedBy field with username, email and _id only
        Comment.countDocuments({ video: videoId })
    ]);

    const totalPages = Math.ceil(totalComments / limitNumber);

    // Step 4: Return comments along with pagination info
    return res.json(new ApiResponse(200, {
        comments,
        pagination: {
            totalComments,
            totalPages,
            currentPage: pageNumber,
            limit: limitNumber
        }
    }, "Comments fetched successfully"));

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    // 1. Validate videoId
    // 2. Validate comment text(content)
    // 3. Create and save the comment
    // 4. Return the created comment details

    const { videoId } = req.params
    const { content } = req.body
    const userId = req.user._id

    // Step 1: Validate videoId
    if (!mongoose.isValidObjectId(videoId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    // Step 2: Validate comment text(content)
    if (!content || typeof content !== "string" || content.trim().length === 0) {
        // console.log("Content is empty or invalid", content);

        throw new ApiError(400, "Comment content cannot be empty");
    }

    // Step 3: Create and save the comment
    const newComment = await Comment.create({
        video: videoId,
        content: content.trim(),
        owner: userId
    });

    // Step 4: Return the created comment details
    return res
        .status(201)
        .json(new ApiResponse(
            201,
            newComment,
            "Comment added successfully"
        ));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    // 1. Validate commentId
    // 2. Validate new comment text(content)
    // 3. Find and update the comment
    // 4. Return the updated comment details

    const { commentId } = req.params
    const { content } = req.body
    const userId = req.user._id

    // Step 1: Validate commentId
    if (!mongoose.isValidObjectId(commentId) || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    // Step 2: Validate new comment text(content)
    if (!content || typeof content !== "string" || content.trim().length === 0) {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    // Step 3: Find and update the comment
    const updatedComment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: userId }, // ensure user can only update their own comment
        { content: content.trim() },
        { new: true } // return the updated document
    );

    if (!updatedComment) {
        throw new ApiError(404, "Comment not found or you are not authorized to update this comment");
    }

    // Step 4: Return the updated comment details
    return res
        .json(new ApiResponse(
            200,
            updatedComment,
            "Comment updated successfully"
        ));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    // 1. Validate commentId
    // 2. Find and delete the comment
    // 3. Return success message

    const { commentId } = req.params
    const userId = req.user._id

    // Step 1: Validate commentId
    if (!mongoose.isValidObjectId(commentId) || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    // Step 2: Find and delete the comment
    const deletedComment = await Comment.findOneAndDelete(
        { _id: commentId, owner: userId } // ensure user can only delete their own comment
    );

    if (!deletedComment) {
        throw new ApiError(404, "Comment not found or you are not authorized to delete this comment");
    }

    // Step 3: Return success message
    return res
        .json(new ApiResponse(
            200,
            deletedComment,
            "Comment deleted successfully"
        ));
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
