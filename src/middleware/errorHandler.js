function errorHandler(err, req, res) {
  console.error("❌ Error:", err.stack || err);
  let statusCode = err.status || 500;

  //admin
  if (req.originalUrl.startsWith("/admin")) {
    return res.status(statusCode).render("errors/admin404", {
      layout: "layouts/adminLayout",
    });
  }
  //vendor
  if (req.originalUrl.startsWith("/vendor")) {
    return res.status(statusCode).render("errors/vendor404", {
      layout: "layouts/vendorLayout",
    });
  }
  //user
  return res.status(statusCode).render("errors/404", {
    layout: "layouts/userLayout",
  });
}

module.exports = errorHandler;
