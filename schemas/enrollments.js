let mongoose = require('mongoose');
let enrollmentSchema = mongoose.Schema({
    student: {
        type: mongoose.Types.ObjectId,
        ref: 'student',
        required: true
    },
    courseClass: {
        type: mongoose.Types.ObjectId,
        ref: 'courseclass',
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})
enrollmentSchema.index(
    { student: 1, courseClass: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
)
enrollmentSchema.index({ student: 1, isDeleted: 1 })
enrollmentSchema.index({ courseClass: 1, isDeleted: 1 })
module.exports = new mongoose.model('enrollment', enrollmentSchema)
