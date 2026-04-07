let mongoose = require('mongoose');
let classSchema = mongoose.Schema({
    name: {
        type: String,
        unique: [true, "name khong duoc trung"],
        required: true
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
module.exports = new mongoose.model('class', classSchema)
