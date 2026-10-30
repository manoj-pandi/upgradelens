// An app that is already migrated to Express 5. The scanner must find nothing here.
const express = require("express");
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("env", "production");
app.get("trust proxy");

app.delete("/user/:id", (req, res) => res.sendStatus(204));

app.get("/user/:id", (req, res) => {
  const id = req.params.id;
  const page = Number(req.query.page ?? 1);
  if (req.acceptsLanguages("en")) {
    res.status(201).json({ id, page });
  }
});

app.get("/files/*splat", (req, res) => {
  res.redirect(301, "/home");
  res.redirect(req.get("Referrer") || "/");
  res.sendFile("/a.txt");
});

app.get("/docs{/*splat}", (req, res) => res.status(200).send("ok"));
router.get("/:file{.:ext}", (req, res) => res.status(200).jsonp({}));
app.get(["/a", "/b"], (req, res) => res.send("many paths"));
app.param("id", (req, res, next, id) => next());

module.exports = { app, router };
