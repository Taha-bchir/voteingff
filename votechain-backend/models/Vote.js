const mongoose = require("mongoose")

const voteSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Poll",
    required: [true, "Poll ID is required"],
  },
  optionIndex: {
    type: Number,
    required: [true, "Option index is required"],
    min: 0,
  },
  voterWallet: {
    type: String,
    required: [true, "Voter wallet address is required"],
    trim: true,
  },
  txHash: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

// Make sure a wallet can only vote once per poll
voteSchema.index({ pollId: 1, voterWallet: 1 }, { unique: true })

const Vote = mongoose.model("Vote", voteSchema)

module.exports = Vote
