var express = require('express');
var router = express.Router();
let semesterModel = require('../schemas/semesters')
const { checkLogin, checkRole } = require("../utils/authHandler");
const { isValidObjectId, parsePagination } = require('../utils/queryHelper')

router.get('/', async function (req, res, next) {
  let { page, limit, skip } = parsePagination(req.query)
  let dataSort = req.query.sortByDate === 'asc' ? 1 : -1
  let filter = {
    isDeleted: false
  }
  let [data, total] = await Promise.all([
    semesterModel.find(filter).skip(skip).limit(limit).sort({ startDate: dataSort }),
    semesterModel.countDocuments(filter)
  ])
  res.send({
    items: data,
    pagination: { page, limit, total }
  });
});
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(400).send({ message: "ID khong hop le" })
    }
    let result = await semesterModel.find({
      isDeleted: false,
      _id: id
    });
    if (result.length) {
      res.send(result[0])
    } else {
      res.status(404).send({
        message: "ID NOT FOUND"
      })
    }
  } catch (error) {
    res.status(404).send({
      message: error.message
    })
  }
});
router.post('/', checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let startDate = new Date(req.body.startDate)
    let endDate = new Date(req.body.endDate)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).send({ message: "startDate/endDate khong hop le" })
    }
    if (endDate <= startDate) {
      return res.status(400).send({ message: "endDate phai lon hon startDate" })
    }
    let newItem = new semesterModel({
      name: req.body.name,
      startDate: startDate,
      endDate: endDate
    })
    await newItem.save()
    res.send(newItem)
  } catch (error) {
    res.status(404).send({
      message: error.message
    })
  }
})
router.put('/:id', checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let id = req.params.id;
    let result = await semesterModel.findByIdAndUpdate(
      id, req.body, {
      new: true
    })
    res.send(result)
  } catch (error) {
    res.status(404).send({
      message: error.message
    })
  }
})
router.delete('/:id', checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let id = req.params.id;
    let result = await semesterModel.findOne({
      isDeleted: false,
      _id: id
    });
    if (result) {
      result.isDeleted = true
      await result.save();
      res.send(result)
    } else {
      res.status(404).send({
        message: "ID NOT FOUND"
      })
    }
  } catch (error) {
    res.status(404).send({
      message: error.message
    })
  }
})

module.exports = router;
