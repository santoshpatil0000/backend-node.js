import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN, // CORS middleware configuration for all origins    // e.g., 'http://myDomain.com'
    credentials: true
}))

// app.use(cors(process.env.CORS_ORIGIN))  // CORS middleware with multiple origins support op

app.use(express.json({limit: "16kb"}))  // to parse JSON request body with size limit
app.use(express.urlencoded({extended: true, limit: "16kb"}))    // to parse URL-encoded in URL with size limit
app.use(express.static("public"))   // to serve static files from 'public' directory
app.use(cookieParser()) // to parse cookies from incoming requests for CRUD operations


//routes import
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)   // http://localhost:8000/api/v1/healthcheck
app.use("/api/v1/users", userRouter)                // http://localhost:8000/api/v1/users/register
app.use("/api/v1/tweets", tweetRouter)              // http://localhost:8000/api/v1/tweets  
app.use("/api/v1/subscriptions", subscriptionRouter)    // http://localhost:8000/api/v1/subscriptions
app.use("/api/v1/videos", videoRouter)              // http://localhost:8000/api/v1/videos
app.use("/api/v1/comments", commentRouter)          // http://localhost:8000/api/v1/comments
app.use("/api/v1/likes", likeRouter)                // http://localhost:8000/api/v1/likes
app.use("/api/v1/playlist", playlistRouter)         // http://localhost:8000/api/v1/playlist
app.use("/api/v1/dashboard", dashboardRouter)       // http://localhost:8000/api/v1/dashboard

export { app }