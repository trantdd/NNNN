let semesterModel = require('../schemas/semesters')

function toValidDate(value) {
    let date = new Date(value)
    if (isNaN(date.getTime())) return null
    return date
}

module.exports = {
    ListSemesters: async function (query) {
        let page = parseInt(query.page || '1')
        let limit = parseInt(query.limit || '20')
        if (isNaN(page) || page < 1) page = 1
        if (isNaN(limit) || limit < 1) limit = 20
        if (limit > 100) limit = 100

        let filter = { isDeleted: false }
        let keyword = (query.keyword || '').trim()
        if (keyword) {
            filter.name = { $regex: keyword, $options: 'i' }
        }

        let skip = (page - 1) * limit
        let [items, total] = await Promise.all([
            semesterModel.find(filter)
                .sort({ startDate: -1 })
                .skip(skip)
                .limit(limit),
            semesterModel.countDocuments(filter)
        ])

        return {
            items: items,
            pagination: { page, limit, total }
        }
    },
    ValidateDateRange: function (startDate, endDate) {
        let start = toValidDate(startDate)
        let end = toValidDate(endDate)
        if (!start || !end) {
            return { valid: false, message: 'startDate/endDate khong hop le' }
        }
        if (end <= start) {
            return { valid: false, message: 'endDate phai lon hon startDate' }
        }
        return { valid: true, startDate: start, endDate: end }
    },
    CreateASemester: async function (name, startDate, endDate) {
        let check = this.ValidateDateRange(startDate, endDate)
        if (!check.valid) {
            throw new Error(check.message)
        }
        let newItem = new semesterModel({
            name: name,
            startDate: check.startDate,
            endDate: check.endDate
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
