var express = require("express");
var router = express.Router();
let teacherModel = require("../schemas/teachers");
let userController = require("../controllers/users");
let teacherController = require("../controllers/teachers");
const { checkLogin, checkRole } = require("../utils/authHandler");
let mongoose = require('mongoose')
let courseClassModel = require('../schemas/courseclasses')

router.get("/", checkLogin, async function (req, res, next) {
  try {
    let data = await teacherController.ListTeachers(req.query, false)
    res.send(data);
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
});
router.get("/trash", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let data = await teacherController.ListTeachers(req.query, true)
    res.send(data);
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
});
router.put("/:id/restore", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await teacherModel.findByIdAndUpdate(
      id,
      { isDeleted: false },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    await updatedItem.populate('user')
    await updatedItem.populate('department')
    res.send(updatedItem);
  } catch (err) {
    res.status(404).send({ message: err.message });
  }
});
router.get("/:id", async function (req, res, next) {
  try {
    let result = await teacherModel.find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      await result[0].populate('user')
      await result[0].populate('department')
      res.send(result[0]);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});
router.post("/", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  let session = await mongoose.startSession();
  session.startTransaction()
  try {
    let newUser = await userController.CreateAnUser(
      req.body.username, req.body.password || 'Default@123', req.body.email,
      'TEACHER', session, req.body.fullName
    )
    let newTeacher = new teacherModel({
      user: newUser._id,
      fullName: req.body.fullName,
      phone: req.body.phone,
      email: req.body.email,
      department: req.body.department
    })
    await newTeacher.save({ session })
    await newTeacher.populate('user')
    await newTeacher.populate('department')
    await session.commitTransaction()
    session.endSession()
    res.send(newTeacher);
  } catch (err) {
    await session.abortTransaction()
    session.endSession()
    res.status(400).send({ message: err.message });
  }
});
router.put("/:id", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await teacherModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedItem) return res.status(404).send({ message: "id not found" });
    await updatedItem.populate('user')
    await updatedItem.populate('department')
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});
router.delete("/:id", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let teacher = await teacherModel.findOne({ _id: id, isDeleted: false })
    if (!teacher) {
      return res.status(404).send({ message: "id not found" });
    }
    let activeCourseClass = await courseClassModel.findOne({ teacher: id, isDeleted: false })
    if (activeCourseClass) {
      return res.status(400).send({ message: "Khong the xoa. Giao vien dang giang day lop hoc phan" })
    }
    teacher.isDeleted = true
    await teacher.save()
    res.send(teacher);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
