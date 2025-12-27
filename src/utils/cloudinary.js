import { v2 as cloudinary } from "cloudinary"
import fs from "fs"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath, oldUrlFromDB = null) => {
    try {
        if (!localFilePath) return null

        if (oldUrlFromDB) {
            const parts = oldUrlFromDB.split('/');
            const fileName = parts.pop(); // get the last part after '/'
            const folder = parts.pop(); // get the folder name before the file name
            const public_id = `${folder}/${fileName.split('.')[0]}`; // construct public_id by removing file extension
            await cloudinary.uploader.destroy(public_id); // delete the old image from Cloudinary
        }

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"   // this will automatically detect the file type (image, video, etc.)
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file after successful upload
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export { uploadOnCloudinary }