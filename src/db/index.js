import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Function to connect to MongoDB
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        // console.log(`test connectionInstance: ${connectionInstance}`);
        // console.log("test connectionInstance:", connectionInstance.connection);
        // console.log("test connectionInstance:", JSON.stringify(connectionInstance));
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB