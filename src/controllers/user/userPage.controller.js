const loadLanding = (req, res) => {
  try {
    res.render("user/landingpage");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const loadHome = (req, res) => {
  res.send("home page");
};

const pageNotFound = (req, res) => {
  console.log("error page reached");
  res.render("user/404");
};

module.exports = {
    loadLanding,
    loadHome,
    pageNotFound,
}