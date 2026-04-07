let rooms = []
for (let floor = 1; floor <= 9; floor++) {
    for (let room = 1; room <= 18; room++) {
        let floorStr = floor.toString().padStart(2, '0')
        let roomStr = room.toString().padStart(2, '0')
        rooms.push('E1-' + floorStr + '-' + roomStr)
    }
}

module.exports = rooms
