const express = require("express");
const app = express();
const router = express.Router();
app.use(express.urlencoded());
app.use(express.urlencoded({ extended: true }));
app.set("env", "x"); app.get("trust proxy");
app.del("/user/:id", (req, res) => res.send(200));
app.get("/user/:id", (req, res) => {
  const id = req.param("id");
  if (req.acceptsLanguage("en")) {}
  req.query.page = 1;
  res.json({ id }, 201);
});
app.get("/files/*", (request, response) => {
  response.redirect("/home", 301);
  response.redirect("back");
  response.sendfile("/a.txt");
  response.send({ ok: true }, 200);
});
router.get("/:file.:ext?", (req, res) => res.jsonp({}, 200));
app.param("id", (req, res, next, id) => next());
// res.send(200) in a comment
const s = "res.json(x, 200)";
app.get("/*splat", (req, res) => res.status(200).send("ok"));
