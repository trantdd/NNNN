var express = require("express");
var router = express.Router();
let classController = require("../controllers/classes");
const { checkLogin, checkRole } = require("../utils/authHandler");

router.get("/", async function (req, res, next) {
  try {
    let data = await classController.ListClasses(req.query);
    res.send(data);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});
router.get("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await classController.FindClassById(id);
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
    let newItem = await classController.CreateAClass(
      req.body.name,
      req.body.department,
    );
    res.send(newItem);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});
router.put("/:id", checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let id = req.params.id;
    let result = await classController.FindClassById(id);
    if (!result) return res.status(404).send({ message: "ID NOT FOUND" });
    result.set(req.body);
    await result.save();
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
      let result = await classController.FindClassById(id);
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
