const { Broker } = require('../models/broker.model');
const axios = require('axios');
const getHeaders = require('../utils/fetchHeader');
const { ApiError } = require('../utils/apiError');
const { encryptData } = require('../utils/encryption');

const loginAngelOne = async (req, res) => {

  try {
    const { client_code, password, totp } = req.body;

    const userId = req.user.id;

    if (!client_code || !password || !totp) {
        throw new ApiError(400, "All fields are required");
    }

    const headers = await getHeaders();
    if (!headers) throw new ApiError(500, "Failed to generate headers");

    const url = "https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword";
    const body = { clientcode: client_code, password, totp };

    const response = await axios.post(url, body, { headers });

    console.log(response)

    if (!response.data?.data?.jwtToken) {
        throw new ApiError(401, "Authentication failed");
    }

    const encryptedCredentials = encryptData(
      JSON.stringify({ 
        credentials: { client_code, password, totp }, 
        token: response.data.data.jwtToken, 
        lastUpdated: new Date()
      })
    );

    await Broker.findOneAndUpdate(
      { userId, brokerId: 'angelOne' },
      {
        userId,
        brokerId: 'angelOne',
        encryptedData: encryptedCredentials,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Successfully logged in to AngelOne',
      brokerId: 'angelOne',
    });
  } catch (error) {
    console.error(`Error in loginAngelOne: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Dhan Login
 */
const loginDhan = async (req, res) => {
  try {
    const { clientId, password, totp } = req.body;
    const userId = req.user.id;

    if (!clientId || !password || !totp) {
      return res.status(400).json({
        success: false,
        message: 'Missing required credentials: clientId, password, and totp are required',
      });
    }

    const apiConfig = {
      baseUrl: 'https://api.dhan.co',
      loginEndpoint: '/auth/login',
    };

    const loginPayload = { client_id: clientId, password, totp };

    let response;
    try {
      response = await axios.post(`${apiConfig.baseUrl}${apiConfig.loginEndpoint}`, loginPayload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Login failed with Dhan API',
        error: error.response?.data || error.message,
      });
    }

    const tokenData = {
      token: response.data.data?.accessToken,
      refreshToken: response.data.data?.refreshToken,
    };

    if (!tokenData.token) {
      return res.status(401).json({
        success: false,
        message: 'Failed to obtain authentication token from Dhan',
      });
    }

    const encryptedCredentials = encryptData(
      JSON.stringify({
        credentials: { clientId, password, totp },
        tokenData,
        lastUpdated: new Date(),
      })
    );

    await BrokerCredential.findOneAndUpdate(
      { userId, brokerId: 'dhan' },
      {
        userId,
        brokerId: 'dhan',
        encryptedData: encryptedCredentials,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Successfully logged in to Dhan',
      brokerId: 'dhan',
    });
  } catch (error) {
    console.error(`Error in loginDhan: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


const loginUpstox = async (req, res) => {
  try {
    const { clientId, password, totp } = req.body;
    const userId = req.user.id;

    if (!clientId || !password || !totp) {
      return res.status(400).json({
        success: false,
        message: 'Missing required credentials: clientId, password, and totp are required',
      });
    }

    const apiConfig = {
      baseUrl: 'https://api.upstox.com/v2',
      loginEndpoint: '/login',
    };

    const loginPayload = { client_id: clientId, password, totp };

    let response;
    try {
      response = await axios.post(`${apiConfig.baseUrl}${apiConfig.loginEndpoint}`, loginPayload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Api-Version': '2.0',
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Login failed with Upstox API',
        error: error.response?.data || error.message,
      });
    }

    const tokenData = {
      token: response.data.data?.accessToken,
      apiKey: response.data.data?.apiKey,
    };

    if (!tokenData.token) {
      return res.status(401).json({
        success: false,
        message: 'Failed to obtain authentication token from Upstox',
      });
    }

    const encryptedCredentials = encryptData(
      JSON.stringify({
        credentials: { clientId, password, totp },
        tokenData,
        lastUpdated: new Date(),
      })
    );

    await BrokerCredential.findOneAndUpdate(
      { userId, brokerId: 'upstox' },
      {
        userId,
        brokerId: 'upstox',
        encryptedData: encryptedCredentials,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Successfully logged in to Upstox',
      brokerId: 'upstox',
    });
  } catch (error) {
    console.error(`Error in loginUpstox: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = { loginAngelOne, loginDhan, loginUpstox };
