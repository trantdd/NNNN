var express = require("express");
var router = express.Router();
let courseClassController = require("../controllers/courseclasses");
let courseClassModel = require("../schemas/courseclasses");
const { checkLogin, checkRole } = require("../utils/authHandler");
let teacherModel = require("../schemas/teachers");
let rooms = require("../utils/rooms");
let { VALID_SLOTS, DAYS_OF_WEEK, isOverlap } = require("../utils/schedules");

router.get("/", async function (req, res, next) {
  try {
    let data = await courseClassController.ListCourseClasses(req.query);
    res.send(data);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});
router.get(
  "/my/teaching",
  checkLogin,
  checkRole("TEACHER"),
  async function (req, res, next) {
    try {
      let teacher = await teacherModel.findOne({
        user: req.user._id,
        isDeleted: false,
      });
      if (!teacher) {
        res.status(404).send({ message: "teacher profile khong ton tai" });
        return;
      }
      let data = await courseClassModel
        .find({
          teacher: teacher._id,
          isDeleted: false,
        })
        .populate("semester")
        .populate("subject")
        .populate({
          path: "teacher",
          populate: { path: "user", select: "fullName" },
        });
      res.send(data);
    } catch (error) {
      res.status(404).send({ message: error.message });
    }
  },
);
router.get("/rooms", async function (req, res, next) {
  res.send(rooms);
});
router.get("/schedule-slots", async function (req, res, next) {
  res.send({
    daysOfWeek: DAYS_OF_WEEK,
    slots: VALID_SLOTS,
  });
});
router.get("/available-slots", async function (req, res, next) {
  try {
    let semester = req.query.semester;
    let teacher = req.query.teacher;
    if (!semester || !teacher) {
      return res
        .status(400)
        .send({ message: "semester va teacher la bat buoc" });
    }
    let existingClasses = await courseClassModel.find({
      semester: semester,
      teacher: teacher,
      isDeleted: false,
    });
    let availableSlots = [];
    for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
      let day = DAYS_OF_WEEK[i];
      for (let j = 0; j < VALID_SLOTS.length; j++) {
        let slot = VALID_SLOTS[j];
        let hasConflict = false;
        for (let k = 0; k < existingClasses.length; k++) {
          let cc = existingClasses[k];
          if (
            cc.schedule.dayOfWeek === day &&
            isOverlap(
              cc.schedule.startPeriod,
              cc.schedule.endPeriod,
              slot.startPeriod,
              slot.endPeriod,
            )
          ) {
            hasConflict = true;
            break;
          }
        }
        if (!hasConflict) {
          availableSlots.push({
            dayOfWeek: day,
            startPeriod: slot.startPeriod,
            endPeriod: slot.endPeriod,
          });
        }
      }
    }
    res.send(availableSlots);
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});
router.get("/available-rooms", async function (req, res, next) {
  try {
    let semester = req.query.semester;
    let dayOfWeek = parseInt(req.query.dayOfWeek);
    let startPeriod = parseInt(req.query.startPeriod);
    let endPeriod = parseInt(req.query.endPeriod);
    if (!semester || !dayOfWeek || !startPeriod || !endPeriod) {
      return res
        .status(400)
        .send({
          message: "semester, dayOfWeek, startPeriod, endPeriod la bat buoc",
        });
    }
    let existingClasses = await courseClassModel.find({
      semester: semester,
      "schedule.dayOfWeek": dayOfWeek,
      isDeleted: false,
    });
    let occupiedRooms = [];
    for (let i = 0; i < existingClasses.length; i++) {
      let cc = existingClasses[i];
      if (
        isOverlap(
          cc.schedule.startPeriod,
          cc.schedule.endPeriod,
          startPeriod,
          endPeriod,
        )
      ) {
        occupiedRooms.push(cc.room);
      }
    }
    let availableRooms = rooms.filter(function (r) {
      return !occupiedRooms.includes(r);
    });
    res.send(availableRooms);
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});
router.get("/:id", async function (req, res, next) {
  try {
    let result = await courseClassController.FindCourseClassById(req.params.id);
    if (!result) return res.status(404).send({ message: "ID NOT FOUND" });
    res.send(result);
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});
router.post("/", checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let scheduleCheck = courseClassController.ValidateSchedule(
      req.body.schedule,
    );
    if (!scheduleCheck.valid)
      return res.status(400).send({ message: scheduleCheck.message });

    let teacherMsg = await courseClassController.CheckTeacherConflict({
      semester: req.body.semester,
      teacher: req.body.teacher,
      schedule: scheduleCheck.schedule,
    });
    if (teacherMsg) return res.status(400).send({ message: teacherMsg });

    let roomMsg = await courseClassController.CheckRoomConflict({
      semester: req.body.semester,
      room: req.body.room,
      schedule: scheduleCheck.schedule,
    });
    if (roomMsg) return res.status(400).send({ message: roomMsg });

    let newItem = await courseClassController.CreateACourseClass(
      req.body.semester,
      req.body.subject,
      req.body.teacher,
      req.body.maxStudents,
      req.body.room,
      scheduleCheck.schedule,
    );
    await newItem.populate("semester");
    await newItem.populate("subject");
    await newItem.populate({
      path: "teacher",
      populate: { path: "user", select: "fullName" },
    });
    res.send(newItem);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});
router.put("/:id", checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let id = req.params.id;
    let existing = await courseClassController.FindCourseClassById(id);
    if (!existing) return res.status(404).send({ message: "ID NOT FOUND" });

    let semester =
      req.body.semester || existing.semester._id || existing.semester;
    let teacher = req.body.teacher || existing.teacher._id || existing.teacher;
    let room = req.body.room !== undefined ? req.body.room : existing.room;
    let rawSchedule = req.body.schedule || existing.schedule;

    let scheduleCheck = courseClassController.ValidateSchedule(rawSchedule);
    if (!scheduleCheck.valid)
      return res.status(400).send({ message: scheduleCheck.message });

    let teacherMsg = await courseClassController.CheckTeacherConflict({
      excludeId: id,
      semester,
      teacher,
      schedule: scheduleCheck.schedule,
    });
    if (teacherMsg) return res.status(400).send({ message: teacherMsg });

    let roomMsg = await courseClassController.CheckRoomConflict({
      excludeId: id,
      semester,
      room,
      schedule: scheduleCheck.schedule,
    });
    if (roomMsg) return res.status(400).send({ message: roomMsg });

    existing.set({ ...req.body, schedule: scheduleCheck.schedule });
    await existing.save();
    res.send(existing);
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
      let result = await courseClassController.FindCourseClassById(
        req.params.id,
      );
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
