var express = require('express');
var router = express.Router();
let courseClassModel = require('../schemas/courseclasses')
const { checkLogin, checkRole } = require("../utils/authHandler");
let teacherModel = require('../schemas/teachers')
let enrollmentModel = require('../schemas/enrollments')
let rooms = require('../utils/rooms')
let { VALID_SLOTS, DAYS_OF_WEEK, isValidSlot, isOverlap } = require('../utils/schedules')
const { isValidObjectId, parsePagination } = require('../utils/queryHelper')

function normalizeSchedule(rawSchedule) {
  return {
    dayOfWeek: parseInt(rawSchedule.dayOfWeek),
    startPeriod: parseInt(rawSchedule.startPeriod),
    endPeriod: parseInt(rawSchedule.endPeriod)
  }
}

async function hasTeacherConflict(params) {
  let teacherClasses = await courseClassModel.find({
    _id: params.excludeId ? { $ne: params.excludeId } : { $exists: true },
    semester: params.semester,
    teacher: params.teacher,
    'schedule.dayOfWeek': params.schedule.dayOfWeek,
    isDeleted: false
  })
  for (let i = 0; i < teacherClasses.length; i++) {
    let cc = teacherClasses[i]
    if (isOverlap(cc.schedule.startPeriod, cc.schedule.endPeriod, params.schedule.startPeriod, params.schedule.endPeriod)) {
      return cc
    }
  }
  return null
}

async function hasRoomConflict(params) {
  if (!params.room) return null
  let roomClasses = await courseClassModel.find({
    _id: params.excludeId ? { $ne: params.excludeId } : { $exists: true },
    semester: params.semester,
    room: params.room,
    'schedule.dayOfWeek': params.schedule.dayOfWeek,
    isDeleted: false
  })
  for (let i = 0; i < roomClasses.length; i++) {
    let cc = roomClasses[i]
    if (isOverlap(cc.schedule.startPeriod, cc.schedule.endPeriod, params.schedule.startPeriod, params.schedule.endPeriod)) {
      return cc
    }
  }
  return null
}

router.get('/', async function (req, res, next) {
  let queries = req.query;
  let { page, limit, skip } = parsePagination(queries)
  let filter = { isDeleted: false };
  if (queries.semester) filter.semester = queries.semester;
  if (queries.teacher) filter.teacher = queries.teacher;
  if (queries.subject) filter.subject = queries.subject;
  if (queries.dayOfWeek) filter['schedule.dayOfWeek'] = parseInt(queries.dayOfWeek)
  let [data, total] = await Promise.all([
    courseClassModel.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate('semester')
    .populate('subject')
    .populate({
      path: 'teacher',
      populate: { path: 'user', select: 'fullName' }
    }),
    courseClassModel.countDocuments(filter)
  ])
  res.send({
    items: data,
    pagination: { page, limit, total }
  });
});
router.get('/my/teaching', checkLogin, checkRole("TEACHER"), async function (req, res, next) {
  try {
    let teacher = await teacherModel.findOne({ user: req.user._id, isDeleted: false })
    if (!teacher) {
      res.status(404).send({ message: "teacher profile khong ton tai" })
      return;
    }
    let data = await courseClassModel.find({
      teacher: teacher._id,
      isDeleted: false
    }).populate('semester').populate('subject').populate({
      path: 'teacher',
      populate: { path: 'user', select: 'fullName' }
    })
    res.send(data)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.get('/rooms', async function (req, res, next) {
  res.send(rooms)
});
router.get('/schedule-slots', async function (req, res, next) {
  res.send({
    daysOfWeek: DAYS_OF_WEEK,
    slots: VALID_SLOTS
  })
});
router.get('/available-slots', async function (req, res, next) {
  try {
    let semester = req.query.semester;
    let teacher = req.query.teacher;
    if (!semester || !teacher) {
      return res.status(400).send({ message: "semester va teacher la bat buoc" })
    }
    let existingClasses = await courseClassModel.find({
      semester: semester,
      teacher: teacher,
      isDeleted: false
    })
    let availableSlots = []
    for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
      let day = DAYS_OF_WEEK[i]
      for (let j = 0; j < VALID_SLOTS.length; j++) {
        let slot = VALID_SLOTS[j]
        let hasConflict = false
        for (let k = 0; k < existingClasses.length; k++) {
          let cc = existingClasses[k]
          if (cc.schedule.dayOfWeek === day &&
            isOverlap(cc.schedule.startPeriod, cc.schedule.endPeriod, slot.startPeriod, slot.endPeriod)) {
            hasConflict = true
            break
          }
        }
        if (!hasConflict) {
          availableSlots.push({
            dayOfWeek: day,
            startPeriod: slot.startPeriod,
            endPeriod: slot.endPeriod
          })
        }
      }
    }
    res.send(availableSlots)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.get('/available-rooms', async function (req, res, next) {
  try {
    let semester = req.query.semester;
    let dayOfWeek = parseInt(req.query.dayOfWeek);
    let startPeriod = parseInt(req.query.startPeriod);
    let endPeriod = parseInt(req.query.endPeriod);
    if (!semester || !dayOfWeek || !startPeriod || !endPeriod) {
      return res.status(400).send({ message: "semester, dayOfWeek, startPeriod, endPeriod la bat buoc" })
    }
    let existingClasses = await courseClassModel.find({
      semester: semester,
      'schedule.dayOfWeek': dayOfWeek,
      isDeleted: false
    })
    let occupiedRooms = []
    for (let i = 0; i < existingClasses.length; i++) {
      let cc = existingClasses[i]
      if (isOverlap(cc.schedule.startPeriod, cc.schedule.endPeriod, startPeriod, endPeriod)) {
        occupiedRooms.push(cc.room)
      }
    }
    let availableRooms = rooms.filter(function (r) {
      return !occupiedRooms.includes(r)
    })
    res.send(availableRooms)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(400).send({ message: "ID khong hop le" })
    }
    let result = await courseClassModel.find({
      isDeleted: false,
      _id: id
    });
    if (result.length) {
      await result[0].populate('semester')
      await result[0].populate('subject')
      await result[0].populate({
        path: 'teacher',
        populate: { path: 'user', select: 'fullName' }
      })
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
    if (!req.body.schedule || !req.body.schedule.dayOfWeek || !req.body.schedule.startPeriod || !req.body.schedule.endPeriod) {
      return res.status(400).send({ message: "schedule (dayOfWeek, startPeriod, endPeriod) la bat buoc" })
    }
    let normalizedSchedule = normalizeSchedule(req.body.schedule)
    if (!isValidSlot(normalizedSchedule.startPeriod, normalizedSchedule.endPeriod)) {
      return res.status(400).send({ message: "Ca hoc khong hop le. Chi chap nhan: 1-3, 4-6, 2-6, 7-11" })
    }
    if (normalizedSchedule.dayOfWeek < 2 || normalizedSchedule.dayOfWeek > 7) {
      return res.status(400).send({ message: "dayOfWeek chi tu 2 den 7 (Thu 2 - Thu 7)" })
    }
    if (req.body.room && !rooms.includes(req.body.room)) {
      return res.status(400).send({ message: "Phong hoc khong ton tai trong he thong" })
    }
    let teacherConflict = await hasTeacherConflict({
      semester: req.body.semester,
      teacher: req.body.teacher,
      schedule: normalizedSchedule
    })
    if (teacherConflict) {
      return res.status(400).send({
        message: "Giao vien bi trung lich day (Thu " + normalizedSchedule.dayOfWeek + ", tiet " + teacherConflict.schedule.startPeriod + "-" + teacherConflict.schedule.endPeriod + ")"
      })
    }
    let roomConflict = await hasRoomConflict({
      semester: req.body.semester,
      room: req.body.room,
      schedule: normalizedSchedule
    })
    if (roomConflict) {
      return res.status(400).send({
        message: "Phong " + req.body.room + " bi trung lich (Thu " + normalizedSchedule.dayOfWeek + ", tiet " + roomConflict.schedule.startPeriod + "-" + roomConflict.schedule.endPeriod + ")"
      })
    }
    let newItem = new courseClassModel({
      semester: req.body.semester,
      subject: req.body.subject,
      teacher: req.body.teacher,
      maxStudents: req.body.maxStudents,
      room: req.body.room,
      schedule: normalizedSchedule
    })
    await newItem.save()
    await newItem.populate('semester')
    await newItem.populate('subject')
    await newItem.populate({
      path: 'teacher',
      populate: { path: 'user', select: 'fullName' }
    })
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
    let existing = await courseClassModel.findOne({ _id: id, isDeleted: false })
    if (!existing) {
      return res.status(404).send({ message: "ID NOT FOUND" })
    }
    let semester = req.body.semester || existing.semester
    let teacher = req.body.teacher || existing.teacher
    let room = req.body.room !== undefined ? req.body.room : existing.room
    let schedule = req.body.schedule ? normalizeSchedule(req.body.schedule) : existing.schedule
    if (req.body.schedule) {
      if (!schedule.dayOfWeek || !schedule.startPeriod || !schedule.endPeriod) {
        return res.status(400).send({ message: "schedule (dayOfWeek, startPeriod, endPeriod) la bat buoc" })
      }
      if (!isValidSlot(schedule.startPeriod, schedule.endPeriod)) {
        return res.status(400).send({ message: "Ca hoc khong hop le. Chi chap nhan: 1-3, 4-6, 2-6, 7-11" })
      }
      if (schedule.dayOfWeek < 2 || schedule.dayOfWeek > 7) {
        return res.status(400).send({ message: "dayOfWeek chi tu 2 den 7 (Thu 2 - Thu 7)" })
      }
    }
    if (req.body.room && !rooms.includes(req.body.room)) {
      return res.status(400).send({ message: "Phong hoc khong ton tai trong he thong" })
    }
    let teacherConflict = await hasTeacherConflict({
      excludeId: id,
      semester: semester,
      teacher: teacher,
      schedule: schedule
    })
    if (teacherConflict) {
      return res.status(400).send({
        message: "Giao vien bi trung lich day (Thu " + schedule.dayOfWeek + ", tiet " + teacherConflict.schedule.startPeriod + "-" + teacherConflict.schedule.endPeriod + ")"
      })
    }
    let roomConflict = await hasRoomConflict({
      excludeId: id,
      semester: semester,
      room: room,
      schedule: schedule
    })
    if (roomConflict) {
      return res.status(400).send({
        message: "Phong " + room + " bi trung lich (Thu " + schedule.dayOfWeek + ", tiet " + roomConflict.schedule.startPeriod + "-" + roomConflict.schedule.endPeriod + ")"
      })
    }
    let result = await courseClassModel.findByIdAndUpdate(id, req.body, { new: true })
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
    if (!isValidObjectId(id)) {
      return res.status(400).send({ message: "ID khong hop le" })
    }
    let result = await courseClassModel.findOne({
      isDeleted: false,
      _id: id
    });
    if (result) {
      let hasEnrollment = await enrollmentModel.findOne({
        courseClass: id,
        isDeleted: false
      })
      if (hasEnrollment) {
        return res.status(400).send({
          message: "Khong the xoa lop hoc phan da co sinh vien dang ky"
        })
      }
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
