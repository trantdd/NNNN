let enrollmentModel = require('../schemas/enrollments')
module.exports = {
    CreateAnEnrollment: async function (student, courseClass, session) {
        let newItem = new enrollmentModel({
            student: student,
            courseClass: courseClass
        });
        await newItem.save({ session });
        return newItem;
    },
    FindEnrollmentById: async function (id) {
        try {
            return await enrollmentModel.findOne({
                _id: id,
                isDeleted: false
            }).populate('student').populate('courseClass')
        } catch (error) {
            return false
        }
    },
    FindEnrollmentsByStudent: async function (studentId) {
        return await enrollmentModel.find({
            student: studentId,
            isDeleted: false
        }).populate({
            path: 'courseClass',
            populate: [
                { path: 'semester' },
                { path: 'subject' },
                { path: 'teacher' }
            ]
        })
    },
    FindEnrollmentsByCourseClass: async function (courseClassId) {
        return await enrollmentModel.find({
            courseClass: courseClassId,
            isDeleted: false
        }).populate('student')
    }
}
