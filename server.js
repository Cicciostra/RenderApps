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
  res.send("<title>APP1</title><style>body {margin: 0;padding: 0;font-family: Arial, sans-serif;background: linear-gradient(135deg, #ff9a9e, #fecfef, #fad0c4);color: #333;}header {background-color: #ff6f61;color: white;padding: 20px;text-align: center;font-size: 2em;letter-spacing: 1px;}.container {margin: 40px auto;width: 80%;background: white;padding: 20px 30px;border-radius: 12px;box-shadow: 0 4px 12px rgba(0,0,0,0.2);}h2 {color: #ff6f61;}button {padding: 12px 20px;font-size: 1em;background-color: #ff6f61;color: white;border: none;border-radius: 6px;cursor: pointer;transition: 0.3s;}button:hover {background-color: #e05850;}</style><body><header>🌈 Benvenuti in APP1 🌈</header><div class='container'><p>Questa è una pagina di prova di Francesco e Loredana.</p><p><a href='/app2'>Cliccami per andare all'App2!</a></p><p><<a href='/app3'>Cliccami per andare all'App3!</a></p></div>");
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





