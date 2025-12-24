class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if (stack) {
            this.stack = stack  // custom stack trace where error is created for better debugging in that file/location
        } else{
            Error.captureStackTrace(this, this.constructor) // default stack trace if no custom stack is provided
        }

    }
}

export {ApiError}