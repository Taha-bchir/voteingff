const jwt = require("jsonwebtoken")
const { ErrorResponse } = require("../utils/errorResponse")
const nacl = require("tweetnacl")
const bs58 = require("bs58")

// Generate a random nonce for authentication
exports.getNonce = async (req, res, next) => {
  try {
    const nonce = Math.floor(Math.random() * 1000000).toString()
    res.status(200).json({
      success: true,
      nonce,
    })
  } catch (err) {
    next(err)
  }
}

// Verify wallet signature and issue JWT
exports.verifySignature = async (req, res, next) => {
  try {
    const { walletAddress, signature, message } = req.body

    if (!walletAddress || !signature || !message) {
      return next(new ErrorResponse("Please provide wallet address, signature, and message", 400))
    }

    // In a real implementation, you would verify the signature against the message
    // For this demo, we'll simulate the verification

    // Create and send JWT token
    const token = jwt.sign({ walletAddress }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })

    // Check if this is an admin wallet
    const adminWallets = process.env.ADMIN_WALLET_ADDRESSES.split(",").map((address) => address.trim())
    const isAdmin = adminWallets.includes(walletAddress)

    res.status(200).json({
      success: true,
      token,
      walletAddress,
      isAdmin,
    })
  } catch (err) {
    next(err)
  }
}

// Check if a wallet is an admin wallet
exports.checkAdmin = async (req, res, next) => {
  try {
    const { walletAddress } = req.body

    if (!walletAddress) {
      return next(new ErrorResponse("Please provide a wallet address", 400))
    }

    const adminWallets = process.env.ADMIN_WALLET_ADDRESSES.split(",").map((address) => address.trim())
    const isAdmin = adminWallets.includes(walletAddress)

    res.status(200).json({
      success: true,
      isAdmin,
    })
  } catch (err) {
    next(err)
  }
}
