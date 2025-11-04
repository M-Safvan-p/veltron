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
      prompt: "select_account", 
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // ensure we have an email
        const email = profile.emails?.[0]?.value?.trim().toLowerCase();
        if (!email) {
          console.error("Google Auth Error: no email returned in profile", { profile });
          return done(null, false, { message: "Google account did not provide an email address." });
        }

        // derive a safe display name
        const displayName =
          profile.displayName ||
          [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(" ").trim() ||
          email.split("@")[0];

        let user = await User.findOne({ email });

        if (user) {
          // if user already uses google, ensure googleId is set
          if (user.authProvider === "google") {
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
            return done(null, user);
          }

          // If email is registered via local strategy, block Google login for that email
          if (user.authProvider === "local") {
            return done(null, false, {
              message: "This email is already registered with password. Please login using email & password.",
            });
          }

          // If authProvider is something else, attach google if safe
          // (optional) handle other providers or return friendly message
          return done(null, false, {
            message: "Account exists with different authentication provider. Please use that provider to login.",
          });
        }

        // robust referral generator
        const newReferralCode = (fullName) => {
          const base = (fullName || "USER").toString();
          const letters = base.replace(/\s+/g, "").slice(0, 4).toUpperCase().padEnd(4, "X");
          const random = Math.floor(1000 + Math.random() * 9000);
          return `${letters}${random}`;
        };

        const newUserData = {
          fullName: displayName,
          email,
          googleId: profile.id,
          authProvider: "google",
          referralCode: newReferralCode(displayName),
        };

        const newUser = await User.create(newUserData);
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
