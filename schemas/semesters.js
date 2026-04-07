let mongoose = require('mongoose');
let semesterSchema = mongoose.Schema({
    name: {
        type: String,
        unique: [true, "name khong duoc trung"],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})
module.exports = new mongoose.model('semester', semesterSchema)
