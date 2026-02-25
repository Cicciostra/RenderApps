const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const SamlStrategy = require("passport-saml").Strategy;
 
const app = express();
 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
 
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
 
passport.use(new SamlStrategy(
  {
    entryPoint: process.env.SAML_ENTRY_POINT,
    issuer: process.env.SAML_ISSUER,
    cert: process.env.SAML_CERT,
    callbackUrl: process.env.BASE_URL + "/app1/acs", // default
    protocol: "https://"
  },
  (profile, done) => done(null, profile)
));
 
function ensureAuth(appName) {
  return (req, res, next) => {
    if (req.isAuthenticated()) return next();
    passport.authenticate("saml", {
      additionalParams: { RelayState: appName }
    })(req, res, next);
  };
}
 
app.get("/app1", ensureAuth("app1"), (req, res) => {
  res.send("<h1>APP 1</h1><a href='/app2'>Vai ad App2</a>");
});
 
app.get("/app2", ensureAuth("app2"), (req, res) => {
  res.send("<h1>APP 2</h1><a href='/app3'>Vai ad App3</a>");
});
 
app.get("/app3", ensureAuth("app3"), (req, res) => {
  res.send("<h1>APP 3</h1><a href='/app1'>Torna ad App1</a>");
});
 
// ACS distinti
app.post("/app1/acs",
  passport.authenticate("saml", { failureRedirect: "/" }),
  (req, res) => res.redirect("/app1")
);
 
app.post("/app2/acs",
  passport.authenticate("saml", { failureRedirect: "/" }),
  (req, res) => res.redirect("/app2")
);
 
app.post("/app3/acs",
  passport.authenticate("saml", { failureRedirect: "/" }),
  (req, res) => res.redirect("/app3")
);
 

app.listen(process.env.PORT || 3000);
