let semesterModel = require('../schemas/semesters')
module.exports = {
    CreateASemester: async function (name, startDate, endDate) {
        let newItem = new semesterModel({
            name: name,
            startDate: startDate,
            endDate: endDate
        });
        await newItem.save();
        return newItem;
    },
    FindSemesterById: async function (id) {
        try {
            return await semesterModel.findOne({
                _id: id,
                isDeleted: false
            })
        } catch (error) {
            return false
        }
    }
}
