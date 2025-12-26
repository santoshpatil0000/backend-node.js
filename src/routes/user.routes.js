import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    updateAccountDetails
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(         // http://localhost:8000/api/v1/users/register
    upload.fields([                     // to handle multiple file upload(middlewares) with different field names(using multer - see multer.middleware.js for more details)
        {
            name: "avatar",             // field name in the form-data for avatar image(FE also should use same field as "avatar" name while sending request)
            maxCount: 1                 // maxCount to specify only one file should be uploaded for this field
        },
        {
            name: "coverImage",         // field name in the form-data for cover image(FE also should use same field as "coverImage" name while sending request)
            maxCount: 1                 // maxCount to specify only one file should be uploaded for this field
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser) // logout route is secured and "verifyJWT" middleware is used to verify access token before logging out user(injecting "user" details in req.user from token in verifyJWT middleware from auth.middleware.js)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router