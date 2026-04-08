let courseClassModel = require("../schemas/courseclasses");
let { isValidSlot, isOverlap } = require("../utils/schedules");
let rooms = require("../utils/rooms");

function normalizeSchedule(s) {
  return {
    dayOfWeek: parseInt(s.dayOfWeek),
    startPeriod: parseInt(s.startPeriod),
    endPeriod: parseInt(s.endPeriod),
  };
}

module.exports = {
  ValidateSchedule: function (schedule) {
    if (
      !schedule ||
      !schedule.dayOfWeek ||
      !schedule.startPeriod ||
      !schedule.endPeriod
    ) {
      return {
        valid: false,
        message: "schedule (dayOfWeek, startPeriod, endPeriod) la bat buoc",
      };
    }
    let s = normalizeSchedule(schedule);
    if (s.dayOfWeek < 2 || s.dayOfWeek > 7) {
      return {
        valid: false,
        message: "dayOfWeek chi tu 2 den 7 (Thu 2 - Thu 7)",
      };
    }
    if (!isValidSlot(s.startPeriod, s.endPeriod)) {
      return {
        valid: false,
        message: "Ca hoc khong hop le. Chi chap nhan: 1-3, 4-6, 2-6, 7-11",
      };
    }
    return { valid: true, schedule: s };
  },
  CheckTeacherConflict: async function ({
    excludeId,
    semester,
    teacher,
    schedule,
  }) {
    let filter = {
      semester,
      teacher,
      "schedule.dayOfWeek": schedule.dayOfWeek,
      isDeleted: false,
    };
    if (excludeId) filter._id = { $ne: excludeId };
    let classes = await courseClassModel.find(filter);
    for (let cc of classes) {
      if (
        isOverlap(
          cc.schedule.startPeriod,
          cc.schedule.endPeriod,
          schedule.startPeriod,
          schedule.endPeriod,
        )
      ) {
        return `Giao vien bi trung lich day (Thu ${schedule.dayOfWeek}, tiet ${cc.schedule.startPeriod}-${cc.schedule.endPeriod})`;
      }
    }
    return null;
  },
  CheckRoomConflict: async function ({ excludeId, semester, room, schedule }) {
    if (!room) return null;
    if (!rooms.includes(room)) return `Phong hoc khong ton tai trong he thong`;
    let filter = {
      semester,
      room,
      "schedule.dayOfWeek": schedule.dayOfWeek,
      isDeleted: false,
    };
    if (excludeId) filter._id = { $ne: excludeId };
    let classes = await courseClassModel.find(filter);
    for (let cc of classes) {
      if (
        isOverlap(
          cc.schedule.startPeriod,
          cc.schedule.endPeriod,
          schedule.startPeriod,
          schedule.endPeriod,
        )
      ) {
        return `Phong ${room} bi trung lich (Thu ${schedule.dayOfWeek}, tiet ${cc.schedule.startPeriod}-${cc.schedule.endPeriod})`;
      }
    }
    return null;
  },
  ListCourseClasses: async function (query) {
    let page = parseInt(query.page || "1");
    let limit = parseInt(query.limit || "20");
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    let filter = { isDeleted: false };
    if (query.semester) filter.semester = query.semester;
    if (query.teacher) filter.teacher = query.teacher;
    if (query.subject) filter.subject = query.subject;
    if (query.dayOfWeek)
      filter["schedule.dayOfWeek"] = parseInt(query.dayOfWeek);

    let skip = (page - 1) * limit;
    let [items, total] = await Promise.all([
      courseClassModel
        .find(filter)
        .populate("semester")
        .populate("subject")
        .populate({
          path: "teacher",
          populate: { path: "user", select: "fullName" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      courseClassModel.countDocuments(filter),
    ]);
    return { items, pagination: { page, limit, total } };
  },
  CreateACourseClass: async function (
    semester,
    subject,
    teacher,
    maxStudents,
    room,
    schedule,
    session,
  ) {
    let newItem = new courseClassModel({
      semester: semester,
      subject: subject,
      teacher: teacher,
      maxStudents: maxStudents,
      room: room,
      schedule: schedule,
    });
    await newItem.save({ session });
    return newItem;
  },
  FindCourseClassById: async function (id) {
    try {
      return await courseClassModel
        .findOne({
          _id: id,
          isDeleted: false,
        })
        .populate("semester")
        .populate("subject")
        .populate("teacher");
    } catch (error) {
      return false;
    }
  },
  FindCourseClassesByTeacher: async function (teacherId) {
    return await courseClassModel
      .find({
        teacher: teacherId,
        isDeleted: false,
      })
      .populate("semester")
      .populate("subject")
      .populate("teacher");
  },
  FindCourseClassesBySemester: async function (semesterId) {
    return await courseClassModel
      .find({
        semester: semesterId,
        isDeleted: false,
      })
      .populate("semester")
      .populate("subject")
      .populate("teacher");
  },
};
