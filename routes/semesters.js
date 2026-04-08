var express = require('express');
var router = express.Router();
let semesterController = require('../controllers/semesters')
const { checkLogin, checkRole } = require("../utils/authHandler");

router.get('/', async function (req, res, next) {
  try {
    let data = await semesterController.ListSemesters(req.query)
    res.send(data);
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
});
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await semesterController.FindSemesterById(id)
    if (result) {
      res.send(result)
    } else {
      res.status(404).send({ message: "ID NOT FOUND" })
    }
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.post('/', checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let newItem = await semesterController.CreateASemester(
      req.body.name,
      req.body.startDate,
      req.body.endDate
    )
    res.send(newItem)
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
})
router.put('/:id', checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let id = req.params.id;
    let result = await semesterController.FindSemesterById(id)
    if (!result) return res.status(404).send({ message: "ID NOT FOUND" })

    let nextStart = req.body.startDate || result.startDate
    let nextEnd = req.body.endDate || result.endDate
    let dateCheck = semesterController.ValidateDateRange(nextStart, nextEnd)
    if (!dateCheck.valid) {
      return res.status(400).send({ message: dateCheck.message })
    }

    result.set({
      ...req.body,
      startDate: dateCheck.startDate,
      endDate: dateCheck.endDate
    })
    await result.save()
    res.send(result)
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
})
router.delete('/:id', checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let id = req.params.id;
    let result = await semesterController.FindSemesterById(id)
    if (!result) return res.status(404).send({ message: "ID NOT FOUND" })
    result.isDeleted = true
    await result.save()
    res.send(result)
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
})

module.exports = router;
