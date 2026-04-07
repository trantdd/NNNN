let teacherModel = require('../schemas/teachers')
module.exports = {
    ListTeachers: async function (query, isDeleted) {
        let page = parseInt(query.page || '1')
        let limit = parseInt(query.limit || '20')
        if (isNaN(page) || page < 1) page = 1
        if (isNaN(limit) || limit < 1) limit = 20
        if (limit > 100) limit = 100

        let filter = {
            isDeleted: isDeleted
        }
        if (query.department) {
            filter.department = query.department
        }
        let keyword = (query.keyword || '').trim()
        if (keyword) {
            filter.$or = [
                { fullName: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } }
            ]
        }

        let skip = (page - 1) * limit
        let [items, total] = await Promise.all([
            teacherModel.find(filter)
                .populate('user')
                .populate('department')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            teacherModel.countDocuments(filter)
        ])
        return {
            items: items,
            pagination: {
                page: page,
                limit: limit,
                total: total
            }
        }
    },
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
