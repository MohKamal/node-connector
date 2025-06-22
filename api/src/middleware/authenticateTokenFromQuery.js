const jwt = require("jsonwebtoken");
const config = require("../../config");

function authenticateToken(req, res, next) {
  const token = req.query.token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
