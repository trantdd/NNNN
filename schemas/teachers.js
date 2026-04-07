let mongoose = require('mongoose');
let teacherSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    department: {
        type: mongoose.Types.ObjectId,
        ref: 'department',
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})
teacherSchema.index({ isDeleted: 1, department: 1, fullName: 1 })
teacherSchema.index({ email: 1 })
module.exports = new mongoose.model('teacher', teacherSchema)
