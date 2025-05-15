const Poll = require("../models/Poll")
const Vote = require("../models/Vote")
const { ErrorResponse } = require("../utils/errorResponse")

// Get all polls
exports.getPolls = async (req, res, next) => {
  try {
    const query = {}

    // Filter options
    if (req.query.isActive === "true") {
      query.isActive = true
      query.deadline = { $gt: new Date() }
    } else if (req.query.isActive === "false") {
      query.isActive = false
    }

    // Search by title or description
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ]
    }

    // Pagination
    const page = Number.parseInt(req.query.page, 10) || 1
    const limit = Number.parseInt(req.query.limit, 10) || 10
    const startIndex = (page - 1) * limit

    // Execute query
    const polls = await Poll.find(query).sort({ createdAt: -1 }).skip(startIndex).limit(limit)

    // Get total count
    const total = await Poll.countDocuments(query)

    // Get vote counts for each poll
    const pollsWithVotes = await Promise.all(
      polls.map(async (poll) => {
        const voteCount = await Vote.countDocuments({ pollId: poll._id })

        // Get votes per option
        const votesPerOption = await Vote.aggregate([
          { $match: { pollId: poll._id } },
          { $group: { _id: "$optionIndex", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ])

        // Convert to array with same length as options
        const voteCounts = Array(poll.options.length).fill(0)
        votesPerOption.forEach((vote) => {
          voteCounts[vote._id] = vote.count
        })

        // Add vote counts to poll
        const pollObj = poll.toObject()
        pollObj._totalVotes = voteCount
        pollObj._votesPerOption = poll.options.map((option, index) => ({
          ...option.toObject(),
          votes: voteCounts[index] || 0,
        }))

        return pollObj
      }),
    )

    res.status(200).json({
      success: true,
      count: polls.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: pollsWithVotes,
    })
  } catch (err) {
    next(err)
  }
}

// Get single poll
exports.getPoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id)

    if (!poll) {
      return next(new ErrorResponse(`Poll not found with id of ${req.params.id}`, 404))
    }

    // Check if poll is expired but still marked as active
    if (poll.isActive && poll.isExpired()) {
      poll.isActive = false
      await poll.save()
    }

    // Get total votes
    const voteCount = await Vote.countDocuments({ pollId: poll._id })

    // Get votes per option
    const votesPerOption = await Vote.aggregate([
      { $match: { pollId: poll._id } },
      { $group: { _id: "$optionIndex", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])

    // Convert to array with same length as options
    const voteCounts = Array(poll.options.length).fill(0)
    votesPerOption.forEach((vote) => {
      voteCounts[vote._id] = vote.count
    })

    // Add vote counts to poll
    const pollObj = poll.toObject()
    pollObj._totalVotes = voteCount
    pollObj._votesPerOption = poll.options.map((option, index) => ({
      ...option.toObject(),
      votes: voteCounts[index] || 0,
    }))

    // Check if user has voted
    if (req.walletAddress) {
      const userVote = await Vote.findOne({
        pollId: poll._id,
        voterWallet: req.walletAddress,
      })

      pollObj.userVote = userVote ? userVote.optionIndex : null
    }

    res.status(200).json({
      success: true,
      data: pollObj,
    })
  } catch (err) {
    next(err)
  }
}

// Create new poll (admin only)
exports.createPoll = async (req, res, next) => {
  try {
    // Add creator wallet address
    req.body.createdBy = req.walletAddress

    // Validate options
    if (!req.body.options || !Array.isArray(req.body.options) || req.body.options.length < 2) {
      return next(new ErrorResponse("Please provide at least two options", 400))
    }

    // Create poll
    const poll = await Poll.create(req.body)

    res.status(201).json({
      success: true,
      data: poll,
    })
  } catch (err) {
    next(err)
  }
}

// Update poll (admin only)
exports.updatePoll = async (req, res, next) => {
  try {
    let poll = await Poll.findById(req.params.id)

    if (!poll) {
      return next(new ErrorResponse(`Poll not found with id of ${req.params.id}`, 404))
    }

    // Make sure user is poll creator
    if (poll.createdBy.toString() !== req.walletAddress) {
      return next(new ErrorResponse(`User ${req.walletAddress} is not authorized to update this poll`, 403))
    }

    // Don't allow updating options if votes exist
    if (req.body.options) {
      const voteCount = await Vote.countDocuments({ pollId: poll._id })
      if (voteCount > 0) {
        return next(new ErrorResponse("Cannot update options after votes have been cast", 400))
      }
    }

    // Update poll
    poll = await Poll.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: poll,
    })
  } catch (err) {
    next(err)
  }
}

// Close poll (admin only)
exports.closePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id)

    if (!poll) {
      return next(new ErrorResponse(`Poll not found with id of ${req.params.id}`, 404))
    }

    // Make sure user is poll creator
    if (poll.createdBy.toString() !== req.walletAddress) {
      return next(new ErrorResponse(`User ${req.walletAddress} is not authorized to close this poll`, 403))
    }

    // Close poll
    poll.isActive = false
    await poll.save()

    res.status(200).json({
      success: true,
      data: poll,
    })
  } catch (err) {
    next(err)
  }
}

// Delete poll (admin only)
exports.deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id)

    if (!poll) {
      return next(new ErrorResponse(`Poll not found with id of ${req.params.id}`, 404))
    }

    // Make sure user is poll creator
    if (poll.createdBy.toString() !== req.walletAddress) {
      return next(new ErrorResponse(`User ${req.walletAddress} is not authorized to delete this poll`, 403))
    }

    // Delete all votes for this poll
    await Vote.deleteMany({ pollId: poll._id })

    // Delete poll
    await poll.remove()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (err) {
    next(err)
  }
}

// Get polls created by the authenticated user (admin only)
exports.getMyPolls = async (req, res, next) => {
  try {
    // Find polls created by this wallet address
    const polls = await Poll.find({ createdBy: req.walletAddress }).sort({ createdAt: -1 })

    // Get vote counts for each poll
    const pollsWithVotes = await Promise.all(
      polls.map(async (poll) => {
        const voteCount = await Vote.countDocuments({ pollId: poll._id })

        // Get votes per option
        const votesPerOption = await Vote.aggregate([
          { $match: { pollId: poll._id } },
          { $group: { _id: "$optionIndex", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ])

        // Convert to array with same length as options
        const voteCounts = Array(poll.options.length).fill(0)
        votesPerOption.forEach((vote) => {
          voteCounts[vote._id] = vote.count
        })

        // Add vote counts to poll
        const pollObj = poll.toObject()
        pollObj._totalVotes = voteCount
        pollObj._votesPerOption = poll.options.map((option, index) => ({
          ...option.toObject(),
          votes: voteCounts[index] || 0,
        }))

        return pollObj
      }),
    )

    res.status(200).json({
      success: true,
      count: polls.length,
      data: pollsWithVotes,
    })
  } catch (err) {
    next(err)
  }
}
