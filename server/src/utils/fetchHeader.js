const os = require('os');
const networkAddress = require('network-address');
const { publicIpv4 } = require('public-ip');

/**
 * Generate dynamic authentication headers for different brokers
 * @param {string} brokerId - The broker identifier (angelOne, dhan, upstox)
 * @param {object} tokenData - The authentication token data
 * @returns {object} - Headers object for the API request
 */
const getDynamicHeaders = async (brokerId, tokenData) => {
  try {
    // Base headers that are common across brokers
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${tokenData.token}`
    };

    // AngelOne specific headers
    if (brokerId === 'angelOne') {
      const localIP = networkAddress();
      const publicIP = await publicIpv4();
      
      // Get MAC address from network interfaces
      const networkInterfaces = os.networkInterfaces();
      let macAddress = "00:00:00:00:00:00";
      
      for (const key in networkInterfaces) {
        const interfaces = networkInterfaces[key];
        for (const net of interfaces) {
          if (!net.internal && net.mac !== "00:00:00:00:00:00") {
            macAddress = net.mac;
            break;
          }
        }
      }
      
      // Add AngelOne specific headers
      Object.assign(headers, {
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": localIP,
        "X-ClientPublicIP": publicIP,
        "X-MACAddress": macAddress,
        "X-PrivateKey": process.env.ANGELONE_API_KEY
      });
    }
    
    // Dhan specific headers (if any)
    else if (brokerId === 'dhan' && tokenData.apiKey) {
      headers['X-API-KEY'] = tokenData.apiKey;
    }
    
    // Upstox specific headers (if any)
    else if (brokerId === 'upstox' && tokenData.apiVersion) {
      headers['X-API-VERSION'] = tokenData.apiVersion;
    }
    
    return headers;
  } catch (error) {
    console.error(`Error generating headers for ${brokerId}:`, error);
    throw new Error(`Failed to generate headers for ${brokerId}`);
  }
};

module.exports = getDynamicHeaders;