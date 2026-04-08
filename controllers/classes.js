let classModel = require("../schemas/classes");
module.exports = {
  ListClasses: async function (query) {
    let page = parseInt(query.page || "1");
    let limit = parseInt(query.limit || "20");
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    let filter = { isDeleted: false };
    if (query.department) {
      filter.department = query.department;
    }
    let keyword = (query.keyword || "").trim();
    if (keyword) {
      filter.name = { $regex: keyword, $options: "i" };
    }

    let skip = (page - 1) * limit;
    let [items, total] = await Promise.all([
      classModel
        .find(filter)
        .populate("department")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      classModel.countDocuments(filter),
    ]);

    return {
      items: items,
      pagination: { page, limit, total },
    };
  },
  CreateAClass: async function (name, department, session) {
    let newItem = new classModel({
      name: name,
      department: department,
    });
    await newItem.save({ session });
    return newItem;
  },
  FindClassById: async function (id) {
    try {
      return await classModel
        .findOne({
          _id: id,
          isDeleted: false,
        })
        .populate("department");
    } catch (error) {
      return false;
    }
  },
  FindClassesByDepartment: async function (departmentId) {
    return await classModel
      .find({
        department: departmentId,
        isDeleted: false,
      })
      .populate("department");
  },
};
