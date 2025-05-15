const express = require("express")
const { getPolls, getPoll, createPoll, updatePoll, closePoll, deletePoll, getMyPolls } = require("../controllers/polls")
const { protect, isAdmin } = require("../middleware/auth")

const router = express.Router()

// Public routes
router.get("/", getPolls)
router.get("/:id", getPoll)

// Protected routes (requires wallet authentication)
router.use(protect)

// Admin only routes
router.get("/admin/mypolls", isAdmin, getMyPolls)
router.post("/", isAdmin, createPoll)
router.put("/:id", isAdmin, updatePoll)
router.put("/:id/close", isAdmin, closePoll)
router.delete("/:id", isAdmin, deletePoll)

module.exports = router
