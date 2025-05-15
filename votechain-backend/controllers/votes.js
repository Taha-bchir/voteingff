const Vote = require("../models/Vote")
const Poll = require("../models/Poll")
const { ErrorResponse } = require("../utils/errorResponse")

// Cast a vote
exports.castVote = async (req, res, next) => {
  try {
    const { pollId, optionIndex } = req.body

    if (!pollId || optionIndex === undefined) {
      return next(new ErrorResponse("Please provide pollId and optionIndex", 400))
    }

    // Get the poll
    const poll = await Poll.findById(pollId)

    if (!poll) {
      return next(new ErrorResponse(`Poll not found with id of ${pollId}`, 404))
    }

    // Check if poll is active
    if (!poll.isActive) {
      return next(new ErrorResponse("This poll is no longer active", 400))
    }

    // Check if poll deadline has passed
    if (poll.isExpired()) {
      poll.isActive = false
      await poll.save()
      return next(new ErrorResponse("This poll has expired", 400))
    }

    // Check if option index is valid
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return next(new ErrorResponse(`Invalid option index: ${optionIndex}`, 400))
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({
      pollId,
      voterWallet: req.walletAddress,
    })

    if (existingVote) {
      return next(new ErrorResponse("You have already voted in this poll", 400))
    }

    // Generate a fake transaction hash for the demo
    const txHash = Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")

    // Create vote
    const vote = await Vote.create({
      pollId,
      optionIndex,
      voterWallet: req.walletAddress,
      txHash,
    })

    res.status(201).json({
      success: true,
      data: vote,
    })
  } catch (err) {
    next(err)
  }
}

// Get all votes for a poll
exports.getPollVotes = async (req, res, next) => {
  try {
    const { pollId } = req.params

    // Get the poll
    const poll = await Poll.findById(pollId)

    if (!poll) {
      return next(new ErrorResponse(`Poll not found with id of ${pollId}`, 404))
    }

    // Check if user is the poll creator
    if (poll.createdBy.toString() !== req.walletAddress) {
      return next(new ErrorResponse(`User ${req.walletAddress} is not authorized to view votes for this poll`, 403))
    }

    // Get votes
    const votes = await Vote.find({ pollId })

    res.status(200).json({
      success: true,
      count: votes.length,
      data: votes,
    })
  } catch (err) {
    next(err)
  }
}

// Get user voting history
exports.getUserVotes = async (req, res, next) => {
  try {
    // Get all votes by this user
    const votes = await Vote.find({ voterWallet: req.walletAddress }).sort({ timestamp: -1 })

    // Get poll details for each vote
    const votesWithPolls = await Promise.all(
      votes.map(async (vote) => {
        const poll = await Poll.findById(vote.pollId)

        if (!poll) {
          return null // Poll may have been deleted
        }

        const voteObj = vote.toObject()
        voteObj.poll = {
          _id: poll._id,
          title: poll.title,
          isActive: poll.isActive,
          deadline: poll.deadline,
          selectedOption: poll.options[vote.optionIndex]?.text || "Unknown option",
        }

        return voteObj
      }),
    )

    // Filter out null values (deleted polls)
    const filteredVotes = votesWithPolls.filter((vote) => vote !== null)

    res.status(200).json({
      success: true,
      count: filteredVotes.length,
      data: filteredVotes,
    })
  } catch (err) {
    next(err)
  }
}
