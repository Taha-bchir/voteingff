const jwt = require("jsonwebtoken")
const { ErrorResponse } = require("../utils/errorResponse")

// Middleware to verify wallet signature and authenticate
exports.protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      console.log("No token found")
      return next(new ErrorResponse("Not authorized to access this route", 401))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!decoded.walletAddress) {
      console.log("Token does not contain walletAddress")
      return next(new ErrorResponse("Invalid token payload", 401))
    }

    req.walletAddress = decoded.walletAddress
    next()
  } catch (err) {
    console.log("Token error:", err.message)
    return next(new ErrorResponse("Not authorized to access this route", 401))
  }
}


// Middleware to check if the wallet is an admin wallet
exports.isAdmin = (req, res, next) => {
  const adminWallets = process.env.ADMIN_WALLET_ADDRESSES.split(",").map((address) => address.trim())

  if (!adminWallets.includes(req.walletAddress)) {
    return next(new ErrorResponse("Admin privileges required to access this route", 403))
  }

  next()
}
