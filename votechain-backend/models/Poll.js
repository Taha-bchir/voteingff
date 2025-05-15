const mongoose = require("mongoose")

const pollSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a poll title"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a poll description"],
      trim: true,
    },
    options: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    createdBy: {
      type: String,
      required: [true, "Please provide the creator wallet address"],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, "Please provide a deadline"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual field to get total votes (will be populated when needed)
pollSchema.virtual("totalVotes").get(function () {
  return this._totalVotes || 0
})

// Virtual field to get votes per option (will be populated when needed)
pollSchema.virtual("votesPerOption").get(function () {
  return this._votesPerOption || []
})

// Method to check if poll is expired
pollSchema.methods.isExpired = function () {
  return new Date() > this.deadline
}

// Middleware to automatically close expired polls when accessed
//pollSchema.pre("findOne", async function (next) {
 // this.populate("votes")
 // next()
//})

// Index for faster queries
pollSchema.index({ createdBy: 1 })
pollSchema.index({ isActive: 1 })
pollSchema.index({ deadline: 1 })

const Poll = mongoose.model("Poll", pollSchema)

module.exports = Poll
