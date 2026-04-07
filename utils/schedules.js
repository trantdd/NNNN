const VALID_SLOTS = [
    { startPeriod: 1, endPeriod: 3 },
    { startPeriod: 4, endPeriod: 6 },
    { startPeriod: 2, endPeriod: 6 },
    { startPeriod: 7, endPeriod: 11 }
]

const DAYS_OF_WEEK = [2, 3, 4, 5, 6, 7]

function isValidSlot(startPeriod, endPeriod) {
    return VALID_SLOTS.some(function (s) {
        return s.startPeriod === startPeriod && s.endPeriod === endPeriod
    })
}

function isOverlap(start1, end1, start2, end2) {
    return start1 <= end2 && start2 <= end1
}

module.exports = {
    VALID_SLOTS: VALID_SLOTS,
    DAYS_OF_WEEK: DAYS_OF_WEEK,
    isValidSlot: isValidSlot,
    isOverlap: isOverlap
}
