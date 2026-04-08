let mongoose = require("mongoose");
let courseClassSchema = mongoose.Schema(
  {
    semester: {
      type: mongoose.Types.ObjectId,
      ref: "semester",
      required: true,
    },
    subject: {
      type: mongoose.Types.ObjectId,
      ref: "subject",
      required: true,
    },
    teacher: {
      type: mongoose.Types.ObjectId,
      ref: "teacher",
      required: true,
    },
    maxStudents: {
      type: Number,
      required: true,
      min: 1,
    },
    currentStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
    room: {
      type: String,
      default: "",
    },
    schedule: {
      dayOfWeek: {
        type: Number,
        required: true,
        min: 2,
        max: 7,
      },
      startPeriod: {
        type: Number,
        required: true,
      },
      endPeriod: {
        type: Number,
        required: true,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
courseClassSchema.index({
  isDeleted: 1,
  semester: 1,
  teacher: 1,
  "schedule.dayOfWeek": 1,
});
courseClassSchema.index({
  isDeleted: 1,
  semester: 1,
  room: 1,
  "schedule.dayOfWeek": 1,
});
courseClassSchema.index({ isDeleted: 1, semester: 1, subject: 1 });
module.exports = new mongoose.model("courseclass", courseClassSchema);
