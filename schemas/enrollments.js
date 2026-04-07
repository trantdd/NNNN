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
module.exports = new mongoose.model('enrollment', enrollmentSchema)
