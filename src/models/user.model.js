import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true, 
        },
        fullName: {
            type: String,
            required: true,
            trim: true, 
            index: true
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {              // pre-save hook to hash password before saving user document (before 'save' operation is executed on user model and stored in DB)
    if(!this.isModified("password")) return next();         // only hash the password if it has been modified (or is new)

    this.password = await bcrypt.hash(this.password, 10)    // hash the password with a salt round of 10 (encryption strength for encrypting password before saving to DB)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){    // custom instance method to compare provided password with stored hashed password ("isPasswordCorrect" custom method name which can be called on user instance)
    return await bcrypt.compare(password, this.password)            // compare provided password(password) with stored hashed password(this.password) and return true/false
}

userSchema.methods.generateAccessToken = function(){    // custom instance method to generate JWT access token for the user instance ("generateAccessToken" custom method name which can be called on user instance)
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,       // secret key to sign the token (from .env file) which can be generated using crypto library or online tools one time and used for verifying token later. This token is not being used to store in DB.
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY  // token expiry time (from .env file) which is lesser than refresh token expiry time usually
        }
    )
}
userSchema.methods.generateRefreshToken = function(){   // custom instance method to generate JWT refresh token for the user instance ("generateRefreshToken" custom method name which can be called on user instance)
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,    // secret key to sign the token (from .env file) which can be generated using crypto library or online tools one time and used for verifying token later. This token is usually stored in DB for session management.
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY // token expiry time (from .env file)
        }
    )
}

export const User = mongoose.model("User", userSchema)