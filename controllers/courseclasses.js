let courseClassModel = require('../schemas/courseclasses')
module.exports = {
    CreateACourseClass: async function (semester, subject, teacher, maxStudents, room, schedule, session) {
        let newItem = new courseClassModel({
            semester: semester,
            subject: subject,
            teacher: teacher,
            maxStudents: maxStudents,
            room: room,
            schedule: schedule
        });
        await newItem.save({ session });
        return newItem;
    },
    FindCourseClassById: async function (id) {
        try {
            return await courseClassModel.findOne({
                _id: id,
                isDeleted: false
            }).populate('semester').populate('subject').populate('teacher')
        } catch (error) {
            return false
        }
    },
    FindCourseClassesByTeacher: async function (teacherId) {
        return await courseClassModel.find({
            teacher: teacherId,
            isDeleted: false
        }).populate('semester').populate('subject').populate('teacher')
    },
    FindCourseClassesBySemester: async function (semesterId) {
        return await courseClassModel.find({
            semester: semesterId,
            isDeleted: false
        }).populate('semester').populate('subject').populate('teacher')
    }
}
