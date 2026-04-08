var express = require('express');
var router = express.Router();
const { checkLogin, checkRole } = require("../utils/authHandler");
let enrollmentController = require('../controllers/enrollments')
let courseClassModel = require('../schemas/courseclasses')
let studentModel = require('../schemas/students')
let gradeModel = require('../schemas/grades')
let mongoose = require('mongoose')

router.get('/', checkLogin, async function (req, res, next) {
  try {
    let student = await studentModel.findOne({ user: req.user._id, isDeleted: false })
    if (!student) return res.status(404).send({ message: "student profile khong ton tai" })
    let enrollments = await enrollmentController.FindEnrollmentsByStudent(student._id)
    res.send(enrollments)
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
});
router.get('/courseclass/:courseClassId', checkLogin, async function (req, res, next) {
  try {
    let enrollments = await enrollmentController.FindEnrollmentsByCourseClass(req.params.courseClassId)
    res.send(enrollments)
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
});
router.post('/register', checkLogin, checkRole("STUDENT"), async function (req, res, next) {
  let session = await mongoose.startSession();
  session.startTransaction()
  try {
    let student = await studentModel.findOne({ user: req.user._id, isDeleted: false })
    if (!student) {
      await session.abortTransaction(); session.endSession()
      return res.status(404).send({ message: "student profile khong ton tai" })
    }

    let courseClass = await courseClassModel.findOne({
      _id: req.body.courseClassId, isDeleted: false
    }).populate('subject').populate('semester')
    if (!courseClass) {
      await session.abortTransaction(); session.endSession()
      return res.status(404).send({ message: "lop hoc phan khong ton tai" })
    }

    let isDuplicate = await enrollmentController.CheckDuplicateEnrollment(student._id, req.body.courseClassId)
    if (isDuplicate) {
      await session.abortTransaction(); session.endSession()
      return res.status(409).send({ message: "da dang ky lop hoc phan nay roi" })
    }

    let conflictMsg = await enrollmentController.CheckConflicts(student._id, courseClass)
    if (conflictMsg) {
      await session.abortTransaction(); session.endSession()
      return res.status(400).send({ message: conflictMsg })
    }

    let newEnrollment = await enrollmentController.CreateAnEnrollment(student._id, req.body.courseClassId, session)

    let newGrade = new gradeModel({ enrollment: newEnrollment._id })
    await newGrade.save({ session })

    let updated = await courseClassModel.findOneAndUpdate(
      { _id: req.body.courseClassId, $expr: { $lt: ["$currentStudents", "$maxStudents"] } },
      { $inc: { currentStudents: 1 } },
      { session, new: true }
    )
    if (!updated) {
      await session.abortTransaction(); session.endSession()
      return res.status(400).send({ message: "lop hoc phan da day" })
    }

    await session.commitTransaction()
    session.endSession()
    res.send(newEnrollment)
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    res.status(400).send({ message: error.message })
  }
})

module.exports = router;
