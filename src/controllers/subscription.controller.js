import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    // 1. Get subscriber from req.user (set by verifyJWT middleware)
    // 2. Validate subscriber
    // 3. Validate channelId
    // 4. Check if channelId exists
    // 5. Check if subscription already exists
    // 6. If exists, unsubscribe (delete subscription)
    // 7. If not exists, subscribe (create subscription)
    // 8. Return appropriate response

    // Step 1: Get subscriber from req.user (set by verifyJWT middleware)
    const subscriber = req.user._id;

    // Step 2: Validate subscriber
    const subscriberUser = await User.findById(subscriber);
    if (!subscriberUser) {
        throw new ApiError(404, "Subscriber user not found");
    }

    // Step 3: Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    // Step 4: Check if channelId exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Step 5: Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: subscriber,
        channel: channelId
    });

    if (existingSubscription) {
        // Step 6: If exists, unsubscribe (delete subscription)
        await existingSubscription.deleteOne();
        return res.status(200).json(new ApiResponse(true, existingSubscription, "Unsubscribed successfully"));
    }
    /* 
    else {
        // Step 7: If not exists, subscribe (create subscription)
        const newSubscription = new Subscription({
            subscriber: subscriber,
            channel: channelId
        });
        await newSubscription.save();
        return res.status(201).json(new ApiResponse(true, newSubscription, "Subscribed successfully"));
    }
        */

    else {
        // Alternative Step 7: If not exists, subscribe (create subscription)
        const newSubscription = await Subscription.create({
            subscriber: subscriber,
            channel: channelId
        });
        return res.status(201).json(new ApiResponse(200, newSubscription, "Subscribed successfully"));
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: get list of subscribers for the given channelId

    //  1. Validate channelId
    //  2. Check if channelId exists
    //  3. Find all subscriptions where channel matches channelId
    //  4. Populate subscriber field to get subscriber details
    //  5. Return list of subscribers

    // Step 1: Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    // Step 2: Check if channelId exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Step 3: Find all subscriptions where channel matches channelId
    const subscriptions = await Subscription.find({ channel: channelId })
        .populate("subscriber", "_id username email"); // Step 4: Populate subscriber field to get subscriber details   

    // Step 5: Return list of subscribers
    const subscribers = subscriptions.map(sub => sub.subscriber);
    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    // TODO: get list of channels to which the given subscriberId has subscribed
    const { subscriberId } = req.params;

    // 1. Validate subscriberId
    // 2. Check if subscriberId exists
    // 3. Find all subscriptions where subscriber matches subscriberId
    // 4. Populate channel field to get channel details
    // 5. Return list of subscribed channels

    // Step 1: Validate subscriberId
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId");
    }

    // Step 2: Check if subscriberId exists
    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found");
    }

    // Step 3: Find all subscriptions where subscriber matches subscriberId
    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "_id username email"); // Step 4: Populate channel field to get channel details

    // Step 5: Return list of subscribed channels
    const subscribedChannels = subscriptions.map(sub => sub.channel);
    return res.status(200).json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}