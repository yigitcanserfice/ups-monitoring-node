// middleware/auth.js
exports.isLoggedIn = (req, res, next) => {
  if (req.session.userId) {
    // Kullanıcı oturum açmışsa devam et
    console.log(req.session);
    next();
  } else {
    // Oturum açmamışsa login sayfasına yönlendir
    res.redirect("/login");
  }
};
exports.isAdmin = (req, res, next) => {
  if (req.session.role === "admin") {
    // Kullanıcı admin ise devam et
    console.log(req.session);
    next();
  } else {
    // Oturum açmamışsa user devices sayfasına yönlendir
    res.redirect("/user/devices");
  }
};
