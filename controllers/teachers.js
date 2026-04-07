let teacherModel = require('../schemas/teachers')
module.exports = {
    CreateATeacher: async function (user, fullName, phone, email, department, session) {
        let newItem = new teacherModel({
            user: user,
            fullName: fullName,
            phone: phone,
            email: email,
            department: department
        });
        await newItem.save({ session });
        return newItem;
    },
    FindTeacherById: async function (id) {
        try {
            return await teacherModel.findOne({
                _id: id,
                isDeleted: false
            }).populate('user').populate('department')
        } catch (error) {
            return false
        }
    },
    FindTeacherByUserId: async function (userId) {
        try {
            return await teacherModel.findOne({
                user: userId,
                isDeleted: false
            }).populate('user').populate('department')
        } catch (error) {
            return false
        }
    }
}
