let enrollmentModel = require('../schemas/enrollments')
let { isOverlap } = require('../utils/schedules')

module.exports = {
    CheckDuplicateEnrollment: async function (studentId, courseClassId) {
        let found = await enrollmentModel.findOne({
            student: studentId,
            courseClass: courseClassId,
            isDeleted: false
        })
        return !!found
    },
    CheckConflicts: async function (studentId, courseClass) {
        let myEnrollments = await enrollmentModel.find({
            student: studentId,
            isDeleted: false
        }).populate({
            path: 'courseClass',
            populate: [{ path: 'subject' }, { path: 'semester' }]
        })

        for (let e of myEnrollments) {
            let enrolled = e.courseClass
            if (!enrolled || enrolled.isDeleted) continue

            let sameSemester = String(enrolled.semester?._id) === String(courseClass.semester?._id)

            if (sameSemester && String(enrolled.subject?._id) === String(courseClass.subject?._id)) {
                return `Da dang ky mon ${courseClass.subject.name} trong hoc ky nay roi`
            }

            if (sameSemester &&
                enrolled.schedule && courseClass.schedule &&
                enrolled.schedule.dayOfWeek === courseClass.schedule.dayOfWeek &&
                isOverlap(
                    enrolled.schedule.startPeriod, enrolled.schedule.endPeriod,
                    courseClass.schedule.startPeriod, courseClass.schedule.endPeriod
                )) {
                return `Trung lich voi lop ${enrolled.subject?.name} (Thu ${enrolled.schedule.dayOfWeek}, tiet ${enrolled.schedule.startPeriod}-${enrolled.schedule.endPeriod})`
            }
        }
        return null
    },
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
