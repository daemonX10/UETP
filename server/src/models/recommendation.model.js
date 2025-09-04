const mongoose = require("mongoose");

const RecommendationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recommendations: [
      {
        date: { type: Date, default: Date.now },
        suggestion: { type: String },
      },
    ],
    goals: [
      {
        goal: { type: String },
        progress: { type: Number, default: 0 },
      },
    ],
  });
  
const Recommendation = mongoose.model('Recommendation', RecommendationSchema);

module.exports = { Recommendation };
  