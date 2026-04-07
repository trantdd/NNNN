let mongoose = require('mongoose')

function isValidObjectId(id) {
  if (!id) return false
  return mongoose.Types.ObjectId.isValid(id)
}

function parsePagination(query) {
  let page = parseInt(query.page || '1')
  let limit = parseInt(query.limit || '20')
  if (isNaN(page) || page < 1) page = 1
  if (isNaN(limit) || limit < 1) limit = 20
  if (limit > 100) limit = 100
  return {
    page: page,
    limit: limit,
    skip: (page - 1) * limit
  }
}

module.exports = {
  isValidObjectId,
  parsePagination
}