import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)   // use filename as unique identifier while saving temporarily(with same name can be overwritten) before uploading to cloudinary
    }
  })
  
export const upload = multer({ 
    storage, 
})