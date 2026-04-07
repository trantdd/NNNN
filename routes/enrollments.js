var express = require('express');
var router = express.Router();
const { checkLogin, checkRole } = require("../utils/authHandler");
let enrollmentModel = require('../schemas/enrollments')
let courseClassModel = require('../schemas/courseclasses')
let studentModel = require('../schemas/students')
let gradeModel = require('../schemas/grades')
let mongoose = require('mongoose')
let { isOverlap } = require('../utils/schedules')

router.get('/', checkLogin, async function (req, res, next) {
  try {
    let student = await studentModel.findOne({ user: req.user._id, isDeleted: false })
    if (!student) {
      res.status(404).send({ message: "student profile khong ton tai" })
      return;
    }
    let enrollments = await enrollmentModel.find({
      student: student._id,
      isDeleted: false
    }).populate({
      path: 'courseClass',
      populate: [
        { path: 'semester' },
        { path: 'subject' },
        { path: 'teacher' }
      ]
    })
    res.send(enrollments)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.get('/courseclass/:courseClassId', checkLogin, async function (req, res, next) {
  try {
    let enrollments = await enrollmentModel.find({
      courseClass: req.params.courseClassId,
      isDeleted: false
    }).populate('student')
    res.send(enrollments)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.post('/register', checkLogin, checkRole("STUDENT"), async function (req, res, next) {
  let session = await mongoose.startSession();
  session.startTransaction()
  try {
    let student = await studentModel.findOne({ user: req.user._id, isDeleted: false })
    if (!student) {
      await session.abortTransaction()
      session.endSession()
      res.status(404).send({ message: "student profile khong ton tai" })
      return;
    }
    let courseClass = await courseClassModel.findOne({
      _id: req.body.courseClassId,
      isDeleted: false
    }).populate('subject').populate('semester')
    if (!courseClass) {
      await session.abortTransaction()
      session.endSession()
      res.status(404).send({ message: "lop hoc phan khong ton tai" })
      return;
    }
    let existEnrollment = await enrollmentModel.findOne({
      student: student._id,
      courseClass: req.body.courseClassId,
      isDeleted: false
    })
    if (existEnrollment) {
      await session.abortTransaction()
      session.endSession()
      res.status(409).send({ message: "da dang ky lop hoc phan nay roi" })
      return;
    }
    let myEnrollments = await enrollmentModel.find({
      student: student._id,
      isDeleted: false
    }).populate({
      path: 'courseClass',
      populate: [{ path: 'subject' }, { path: 'semester' }]
    })
    for (let i = 0; i < myEnrollments.length; i++) {
      let enrolled = myEnrollments[i].courseClass
      if (!enrolled || enrolled.isDeleted) continue
      if (String(enrolled.semester?._id) === String(courseClass.semester?._id) &&
          String(enrolled.subject?._id) === String(courseClass.subject?._id)) {
        await session.abortTransaction()
        session.endSession()
        res.status(400).send({ message: "Da dang ky mon " + courseClass.subject.name + " trong hoc ky nay roi" })
        return;
      }
      if (String(enrolled.semester?._id) === String(courseClass.semester?._id) &&
          enrolled.schedule && courseClass.schedule &&
          enrolled.schedule.dayOfWeek === courseClass.schedule.dayOfWeek &&
          isOverlap(enrolled.schedule.startPeriod, enrolled.schedule.endPeriod,
                    courseClass.schedule.startPeriod, courseClass.schedule.endPeriod)) {
        await session.abortTransaction()
        session.endSession()
        res.status(400).send({ message: "Trung lich voi lop " + enrolled.subject?.name + " (Thu " + enrolled.schedule.dayOfWeek + ", tiet " + enrolled.schedule.startPeriod + "-" + enrolled.schedule.endPeriod + ")" })
        return;
      }
    }
    let newEnrollment = new enrollmentModel({
      student: student._id,
      courseClass: req.body.courseClassId
    })
    await newEnrollment.save({ session })
    let newGrade = new gradeModel({
      enrollment: newEnrollment._id
    })
    await newGrade.save({ session })
    let updated = await courseClassModel.findOneAndUpdate(
      { _id: req.body.courseClassId, $expr: { $lt: ["$currentStudents", "$maxStudents"] } },
      { $inc: { currentStudents: 1 } },
      { session: session, new: true }
    )
    if (!updated) {
      await session.abortTransaction()
      session.endSession()
      res.status(400).send({ message: "lop hoc phan da day" })
      return;
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
