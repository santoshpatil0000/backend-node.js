import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist

    // 1. Fetch name, description from req.body and userId from req.user(populated by verifyJWT middleware)
    // 2. Validate name and description (e.g., not empty)
    // 3. Create new Playlist document and save to DB
    // 4. Return success response with created playlist data

    // Step 1: Extract data from request
    const userId = req.user._id;

    // Step 2: Validate input
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }

    // Step 3: Create and save playlist
    /*
    const newPlaylist = new Playlist({
        name,
        description,
        owner: userId,
        videos: []
    });
    await newPlaylist.save();
    return res.status(201).json(new ApiResponse(200, newPlaylist, "Playlist created successfully"));
    */

    // Alternative Step 3: Using create method
    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: userId,
        videos: []
    });
    return res
        .status(201)
        .json(new ApiResponse(
            200,
            newPlaylist,
            "Playlist created successfully"
        ));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    // 1. Validate userId
    // 2. Fetch playlists from DB where owner matches userId
    // 3. Return success response with playlists data

    // Step 1: Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    // Step 2: Fetch playlists
    const playlists = await Playlist.find({ owner: userId }).populate("videos").exec();

    // Step 3: Return response
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            playlists,
            "User playlists fetched successfully"
        ));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    // 1. Validate playlistId
    // 2. Fetch playlist from DB by _id
    // 3. If not found, throw 404 error
    // 4. Return success response with playlist data

    // Step 1: Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId");
    }

    // Step 2: Fetch playlist
    const playlist = await Playlist.findById(playlistId).populate("videos").exec();

    // Step 3: Check if playlist exists
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Step 4: Return response
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            playlist,
            "Playlist fetched successfully"
        ));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    // TODO: add video to playlist

    // 1. Validate playlistId and videoId
    // 2. Fetch playlist from DB
    // 3. If not found, throw 404 error
    // 4. Add videoId to playlist's videos array if not already present
    // 5. If already present, throw 400 error
    // 6. Save updated playlist
    // 7. Return success response with updated playlist data

    // Step 1: Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId");
    }

    // Step 2: Fetch playlist
    const playlist = await Playlist.findById(playlistId).exec();

    // Step 3: Check if playlist exists
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Step 4: Check if video already in playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already in playlist");
    }

    // Step 5: Add video to playlist
    playlist.videos.push(videoId);
    await playlist.save();

    // Step 6: Return response
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            playlist,
            "Video added to playlist successfully"
        ));

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    // 1. Validate playlistId and videoId
    // 2. Fetch playlist from DB
    // 3. If not found, throw 404 error
    // 4. Remove videoId from playlist's videos array if present
    // 5. If not present, throw 400 error
    // 6. Save updated playlist
    // 7. Return success response with updated playlist data

    // Step 1: Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId");
    }

    // Step 2: Fetch playlist
    const playlist = await Playlist.findById(playlistId).exec();

    // Step 3: Check if playlist exists
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Step 4: Check if video is in playlist
    const videoIndex = playlist.videos.indexOf(videoId);
    if (videoIndex === -1) {
        throw new ApiError(400, "Video not found in playlist");
    }

    // Step 5: Remove video from playlist
    playlist.videos.splice(videoIndex, 1);
    await playlist.save();

    // Step 6: Return response
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            playlist,
            "Video removed from playlist successfully"
        ));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    // 1. Validate playlistId
    // 2. Fetch playlist from DB
    // 3. If not found, throw 404 error
    // 4. If found, Delete playlist
    // 5. Return success response

    // Step 1: Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId");
    }

    // Step 2: Fetch playlist
    const playlist = await Playlist.findById(playlistId).exec();

    // Step 3: Check if playlist exists
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Step 4: Delete playlist
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId).exec();

    // Step 5: Return response
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            deletedPlaylist,
            "Playlist deleted successfully"
        ));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    // 1. Validate playlistId
    // 2. validate name and description(e.g., not empty)
    // 3. Fetch playlist from DB
    // 4. If not found, throw 404 error
    // 5. If found, update name and description
    // 6. Save updated playlist
    // 7. Return success response with updated playlist data

    // Step 1: Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId");
    }

    // Step 2: Validate input
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }

    // Step 3: Fetch playlist
    const playlist = await Playlist.findById(playlistId).exec();

    // Step 4: Check if playlist exists
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Step 5: Update playlist details
    playlist.name = name;
    playlist.description = description;
    await playlist.save();

    // Step 6: Return response
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            playlist,
            "Playlist updated successfully"
        ));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
