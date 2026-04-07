let subjectModel = require("../schemas/subjects");
module.exports = {
  ListSubjects: async function (query) {
    let page = parseInt(query.page || "1");
    let limit = parseInt(query.limit || "20");
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    let filter = { isDeleted: false };
    let keyword = (query.keyword || "").trim();
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { subjectCode: { $regex: keyword, $options: "i" } },
      ];
    }
    if (query.credits) {
      filter.credits = parseInt(query.credits);
    }

    let skip = (page - 1) * limit;
    let [items, total] = await Promise.all([
      subjectModel
        .find(filter)
        .sort({ subjectCode: 1 })
        .skip(skip)
        .limit(limit),
      subjectModel.countDocuments(filter),
    ]);
    return {
      items: items,
      pagination: { page, limit, total },
    };
  },
  CreateASubject: async function (name, subjectCode, credits) {
    let newItem = new subjectModel({
      name: name,
      subjectCode: subjectCode,
      credits: credits,
    });
    await newItem.save();
    return newItem;
  },
  FindSubjectById: async function (id) {
    try {
      return await subjectModel.findOne({
        _id: id,
        isDeleted: false,
      });
    } catch (error) {
      return false;
    }
  },
};
