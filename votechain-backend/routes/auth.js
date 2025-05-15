const jwt = require("jsonwebtoken");
const express = require("express")
const { getNonce, verifySignature, checkAdmin } = require("../controllers/auth")
const { protect } = require("../middleware/auth")



const router = express.Router()

router.get("/nonce", getNonce)
router.post("/verify", verifySignature)
router.post("/check-admin", checkAdmin)

module.exports = router
