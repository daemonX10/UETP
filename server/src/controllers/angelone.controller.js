const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const axios = require("axios");
const getHeaders = require("../utils/fetchHeader");

const login = asyncHandler(async (req, res) => {
    try {
        const { client_code, password, totp } = req.body;

        if (!client_code || !password || !totp) {
            throw new ApiError(400, "All fields are required");
        }

        const headers = await getHeaders();
        if (!headers) throw new ApiError(500, "Failed to generate headers");

        const url = "https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword";
        const body = { clientcode: client_code, password, totp };

        const response = await axios.post(url, body, { headers });

        if (!response.data?.data?.jwtToken) {
            throw new ApiError(401, "Authentication failed");
        }

        return res.status(200).json(
            new ApiResponse(200, { authToken: response.data.data.jwtToken }, "Login Successful")
        );

    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message).toResponse());
    }
});

const fetchHoldings = asyncHandler(async (req, res) => {
    try {
        const { authToken } = req.body;

        if (!authToken) throw new ApiError(401, "Missing authentication token");

        const headers = await getHeaders(authToken);
        if (!headers) throw new ApiError(500, "Failed to generate headers");

        const url = "https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getAllHolding";
        const response = await axios.get(url, { headers });

        return res.status(200).json(
            new ApiResponse(200, response.data, "Holdings fetched successfully")
        );

    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message).toResponse());
    }
});

const executeTrade = asyncHandler(async (req, res) => {
    try {
        const { authToken, exchange, tradingsymbol, transactionType, quantity, orderType, price, productType, validity } = req.body;

        if (!authToken || !exchange || !tradingsymbol || !transactionType || !quantity || !orderType || !productType || !validity) {
            throw new ApiError(400, "All required fields must be provided");
        }

        const headers = await getHeaders(authToken);
        if (!headers) throw new ApiError(500, "Failed to generate headers");

        const url = "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder";
        const body = { exchange, tradingsymbol, transactiontype: transactionType, quantity, ordertype: orderType, price: price || 0, producttype: productType, validity };

        const response = await axios.post(url, body, { headers });

        if (!response.data?.data?.orderid) throw new ApiError(400, "Trade execution failed");

        return res.status(200).json(
            new ApiResponse(200, { orderId: response.data.data.orderid }, "Trade executed successfully")
        );

    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message).toResponse());
    }
});

const modifyOrder = asyncHandler(async (req, res) => {
    try {
        const { authToken, orderId, quantity, price, orderType, validity } = req.body;

        if (!authToken || !orderId || !quantity || !orderType || !validity) {
            throw new ApiError(400, "All required fields must be provided");
        }

        const headers = await getHeaders(authToken);
        if (!headers) throw new ApiError(500, "Failed to generate headers");

        const url = "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/modifyOrder";
        const body = { orderid: orderId, quantity, price, ordertype: orderType, validity };

        const response = await axios.post(url, body, { headers });

        return res.status(200).json(new ApiResponse(200, response.data, "Order modified successfully"));
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message).toResponse());
    }
});

const cancelOrder = asyncHandler(async (req, res) => {
    try {
        const { authToken, orderId } = req.body;
        if (!authToken || !orderId) throw new ApiError(400, "Missing order ID or authentication token");

        const headers = await getHeaders(authToken);
        if (!headers) throw new ApiError(500, "Failed to generate headers");

        const url = "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder";
        const body = { orderid: orderId };

        const response = await axios.post(url, body, { headers });

        return res.status(200).json(new ApiResponse(200, response.data, "Order canceled successfully"));
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message).toResponse());
    }
});

const fetchOrderBook = asyncHandler(async (req, res) => {
    try {
        const { authToken } = req.body;
        if (!authToken) throw new ApiError(401, "Missing authentication token");

        const headers = await getHeaders(authToken);
        if (!headers) throw new ApiError(500, "Failed to generate headers");

        const url = "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook";
        const response = await axios.get(url, { headers });

        return res.status(200).json(new ApiResponse(200, response.data, "Order book fetched successfully"));
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message).toResponse());
    }
});

const fetchTradeBook = asyncHandler(async (req, res) => {
    try {
        const { authToken } = req.body;
        if (!authToken) throw new ApiError(401, "Missing authentication token");

        const headers = await getHeaders(authToken);
        if (!headers) throw new ApiError(500, "Failed to generate headers");

        const url = "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook";
        const response = await axios.get(url, { headers });

        return res.status(200).json(new ApiResponse(200, response.data, "Trade book fetched successfully"));
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message).toResponse());
    }
});

module.exports = { login, fetchHoldings, executeTrade, modifyOrder, cancelOrder, fetchOrderBook, fetchTradeBook };
