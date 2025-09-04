class ApiResponse{
    constructor(status, data, message = "sent successfully"){
       this.statuscode = status;
       this.data = data;
       this.message = message;
       this.success = status < 400;
    }
}

module.exports = ApiResponse;