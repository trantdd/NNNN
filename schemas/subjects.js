let mongoose = require("mongoose");
let subjectSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subjectCode: {
      type: String,
      required: true,
      unique: true,
    },
    credits: {
      type: Number,
      min: 1,
      required: true,
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
subjectSchema.index({ isDeleted: 1 });
subjectSchema.index({ subjectCode: 1 });
subjectSchema.index({ name: "text" });
module.exports = new mongoose.model("subject", subjectSchema);
