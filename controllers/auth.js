module.exports.login = function (req, res) {
  res.status(200).json({
    message: "logged in",
  });
};

module.exports.register = function (req, res) {
  res.status(200).json({
    message: "register in",
  });
};

module.exports.logout = function (req, res) {
  res.status(200).json({
    message: "logged out ",
  });
};
