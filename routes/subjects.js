var express = require('express');
var router = express.Router();
let subjectModel = require('../schemas/subjects')
const { checkLogin, checkRole } = require("../utils/authHandler");
const { isValidObjectId, parsePagination } = require('../utils/queryHelper')

router.get('/', async function (req, res, next) {
  let { page, limit, skip } = parsePagination(req.query)
  let keyword = (req.query.keyword || '').trim()
  let filter = {
    isDeleted: false
  }
  if (keyword) {
    filter.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { subjectCode: { $regex: keyword, $options: 'i' } }
    ]
  }
  let [data, total] = await Promise.all([
    subjectModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    subjectModel.countDocuments(filter)
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
    let result = await subjectModel.find({
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
    let newItem = new subjectModel({
      name: req.body.name,
      subjectCode: req.body.subjectCode,
      credits: req.body.credits
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
    let result = await subjectModel.findByIdAndUpdate(
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
    let result = await subjectModel.findOne({
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
