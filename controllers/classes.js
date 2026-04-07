let classModel = require('../schemas/classes')
module.exports = {
    CreateAClass: async function (name, department, session) {
        let newItem = new classModel({
            name: name,
            department: department
        });
        await newItem.save({ session });
        return newItem;
    },
    FindClassById: async function (id) {
        try {
            return await classModel.findOne({
                _id: id,
                isDeleted: false
            }).populate('department')
        } catch (error) {
            return false
        }
    },
    FindClassesByDepartment: async function (departmentId) {
        return await classModel.find({
            department: departmentId,
            isDeleted: false
        }).populate('department')
    }
}
