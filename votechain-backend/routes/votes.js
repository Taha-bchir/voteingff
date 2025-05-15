const express = require("express")
const { castVote, getPollVotes, getUserVotes } = require("../controllers/votes")
const { protect, isAdmin } = require("../middleware/auth")

const router = express.Router()

// All vote routes require authentication
router.use(protect)

// User routes
router.post("/votes", protect, castVote)
router.get("/history", getUserVotes)

// Admin routes
router.get("/poll/:pollId", isAdmin, getPollVotes)

module.exports = router
