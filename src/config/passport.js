const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user/userSchema");
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = require("./env");

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);
        user = await User.findOne({ email });
        if (user) {
          if (user.authProvider === "google") {
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
            return done(null, user);
          }

          if (user.authProvider === "local") {
            return done(null, false, {
              message: "This email is already registered with password. Please login using email & password.",
            });
          }
        }

        // get referral code function
        const newReferralCode = (fullName) => {
          const random = Math.floor(1000 + Math.random() * 9000);
          return fullName.slice(0, 4).toUpperCase() + random;
        };

        const newUser = await User.create({
          fullName: profile.displayName,
          email,
          googleId: profile.id,
          authProvider: "google",
          referralCode: newReferralCode(profile.displayName),
        });

        return done(null, newUser);
      } catch (error) {
        console.error("Google Auth Error:", error);
        return done(null, false, { message: "Server error in Google authentication" });
      }
    }
  )
);

// Serialize & Deserialize
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err, null));
});

module.exports = passport;
