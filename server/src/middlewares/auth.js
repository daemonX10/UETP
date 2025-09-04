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

        const decryptedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (!decryptedToken) {
            throw new ApiError(500, "Failed to authenticate user");
        }

        const user = await User.findById(decryptedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;

    } catch (error) {
        return res.json({
            "statuscode": error.statuscode || 500,
            "error": error.message
        });
    }
    next();
});

module.exports = verifyJWT;