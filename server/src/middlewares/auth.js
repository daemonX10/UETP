const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const jwt = require('jsonwebtoken');

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req?.cookies?.accessToken || req?.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized user");
        }

        // Use JWT_SECRET which is what generateAuthToken uses
        const decryptedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (!decryptedToken) {
            throw new ApiError(500, "Failed to authenticate user");
        }

        // The token payload uses 'id' not '_id'
        const user = await User.findById(decryptedToken?.id);

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;

    } catch (error) {
        return res.json({
            "statuscode": error.statusCode || 500,
            "error": error.message
        });
    }
    next();
});

module.exports = verifyJWT;