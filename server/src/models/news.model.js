const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    link: { type: String, required: true },
    source: { type: String },
    date: { type: Date, default: Date.now },
});

const News = mongoose.model("News", newsSchema);

module.exports = { News };
      
      
