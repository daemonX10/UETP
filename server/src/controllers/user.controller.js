const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const bcyrpt = require("bcrypt");
const { sendVerificationEmail } = require("../utils/sendVerificationEmail");

const generateRefreshTokenAndAccessToken = async(userid) => {
    const user = await User.findById(userid)
    const accessToken =  user.generateAccessToken()
    const refreshToken =  user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})
    return {accessToken, refreshToken}
}

const options = {
    // httpOnly: true,
    secure: true,
    sameSite: 'None', 
};

const Register = asyncHandler(async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return ApiError(res, 400, "All fields are required");
        }

        console.log(name, email, password);

        if (password.length < 8) {
            return ApiError(res, 400, "Password should be at least 8 characters long");
        }

        const isUserExists = await User.findOne({ email });

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        console.log(verifyCode);
        console.log(isUserExists);

        if (isUserExists) {
            if (isUserExists.isVerified) {
                return res.status(409).json({
                    success: false,
                    message: "User already exists",
                });
            } else {
                const hashedPassword = await bcyrpt.hash(password, 10);
                isUserExists.name = name;
                isUserExists.password = hashedPassword;
                isUserExists.verifyCode = verifyCode;
                isUserExists.verifyCodeExpiration = new Date(Date.now() + 3600000);

                await isUserExists.save();

                return res.status(200).json({
                    success: true,
                    message: "Verification code resent to your email",
                });
            }
        } else {
            const hashedPassword = await bcyrpt.hash(password, 10);
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 2);

            console.log(expiryDate);

            const user = new User({
                name,
                email,
                password: hashedPassword,
                verifyCode,
                verifyCodeExpiration: expiryDate,
                isVerified: false,
                portfolio: [],
                angelOne: {},
                upstox: {},
                dhan: {},
                cryptoWallet: {},
            });

            await user.save();
        }

        console.log("newUser");

        const emailResponse = await sendVerificationEmail(name, email, verifyCode);

        if (!emailResponse.success) {
            return res.status(500).json({
                success: false,
                message: emailResponse.message,
            });
        }

        return res.status(201).json({
            success: true,
            message: "User registered successfully, Please check your email for verification",
        });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
});


const verifyEmail = asyncHandler(async(req, res)=>{
    try {
        const { email, verifyCode } = req.body;

        if(!email || !verifyCode){
            throw new ApiError(`All fields are required`);
        }

        const user = await User.findOne({ email })

        if(!user){
            throw new ApiError(400, "Invalid User")
        }

        if(new Date() > user.verifyCodeExpiration){
            throw new ApiError(400, "Verification code has expired, please Register again !")
        }

        if(user.verifyCode !== verifyCode){
            throw new ApiError(400, "Invalid verification code")
        }

        user.isVerified = true
        await user.save()

        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Email verified successfully, you can now login"
            )
        )

    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(error.toResponse());
        }
    }
})

const login = asyncHandler(async(req, res)=>{
    try {
        
        const { email, password } = req.body;

        if(!email || !password){
            throw new ApiError(`All fields are required`);
        }

        const user = await User.findOne({ email: email, isVerified : true })

        if(!user){
           throw new ApiError(400, "User does not exist")
        }

        const isMatch = await bcyrpt.compare(password, user.password)

        if(!isMatch){
           throw new ApiError(400, "Invalid password")
        }


        const loggedInUser = await User.findById(user?._id).select("-password -verifyCode -verifyCodeExpiration -portfolio")

        console.log(loggedInUser)

        const { accessToken, refreshToken } = await generateRefreshTokenAndAccessToken(user?._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    201,
                    {
                        user: loggedInUser,
                        token : accessToken,
                        refreshToken : refreshToken
                    },
                    "User Loggedin Successfully"
                )
            )
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(error.toResponse());
        }
    }
})

const logout = asyncHandler(async(req,res)=>{
    try {

        console.log(req.user)

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                refreshToken : undefined
                }
            },
            {
                new: true
            }
        )

        console.log(user)   

        return res
           .clearCookie('accessToken', options)
           .clearCookie('refreshToken', options)
           .status(200)
           .json(
                new ApiResponse(
                    200,
                    {},
                    "User Loggedout Successfully"
                )
            )
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(error.toResponse());
        }
    }
})


module.exports = { Register, verifyEmail, login, logout }; 