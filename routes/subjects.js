var express = require("express");
var router = express.Router();
let subjectController = require("../controllers/subjects");
const { checkLogin, checkRole } = require("../utils/authHandler");

router.get("/", async function (req, res, next) {
  try {
    let data = await subjectController.ListSubjects(req.query);
    res.send(data);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});
router.get("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await subjectController.FindSubjectById(id);
    if (result) {
      res.send(result);
    } else {
      res.status(404).send({ message: "ID NOT FOUND" });
    }
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});
router.post("/", checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let newItem = await subjectController.CreateASubject(
      req.body.name,
      req.body.subjectCode,
      req.body.credits,
    );
    res.send(newItem);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});
router.put("/:id", checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let id = req.params.id;
    let existing = await subjectController.FindSubjectById(id);
    if (!existing) return res.status(404).send({ message: "ID NOT FOUND" });
    let result = await existing.set(req.body).save();
    res.send(result);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});
router.delete(
  "/:id",
  checkLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    try {
      let id = req.params.id;
      let result = await subjectController.FindSubjectById(id);
      if (!result) return res.status(404).send({ message: "ID NOT FOUND" });
      result.isDeleted = true;
      await result.save();
      res.send(result);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  },
);

module.exports = router;
