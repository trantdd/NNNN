let subjectModel = require('../schemas/subjects')
module.exports = {
    CreateASubject: async function (name, subjectCode, credits) {
        let newItem = new subjectModel({
            name: name,
            subjectCode: subjectCode,
            credits: credits
        });
        await newItem.save();
        return newItem;
    },
    FindSubjectById: async function (id) {
        try {
            return await subjectModel.findOne({
                _id: id,
                isDeleted: false
            })
        } catch (error) {
            return false
        }
    }
}
