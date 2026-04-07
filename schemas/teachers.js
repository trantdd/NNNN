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
module.exports = new mongoose.model('teacher', teacherSchema)
