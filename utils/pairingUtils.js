const { v4: uuidv4 } = require('uuid');

function pairUsers(userId, users, io) {
  const user = users.get(userId);

  // Prioritization logic (can be customized further)
  const scoreCriteria = [
    { 
      criteria: (otherUser) => otherUser.preferredGender === user.userGender,  
      weight: 2 // Higher weight for matching gender preference
    }, 
    { 
      criteria: (otherUser) => otherUser.preferredCollege === user.userCollege, 
      weight: 1  // Lower weight for matching college preference
    },
  ];

  let bestMatch = null;
  let maxScore = -1;
 
  for (const otherUser of users.values()) {
    if (
      otherUser.userEmail !== userId && 
      !otherUser.isPaired
    ) {
      let score = 0;

      for (const criterion of scoreCriteria) {
        if (
          criterion.criteria(otherUser) ||
          otherUser.preferredGender === 'any' || 
          user.preferredGender === 'any' ||
          otherUser.preferredCollege === 'any' || 
          user.preferredCollege === 'any'
        ) {
          score += criterion.weight;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = otherUser;
      }
    }
  }

  if (bestMatch) {
    const roomId = uuidv4();

    // Pair the users 
    user.isPaired = true;
    user.room = roomId;
    user.pairedSocketId = bestMatch.socket.id;
    bestMatch.isPaired = true;
    bestMatch.room = roomId;
    bestMatch.pairedSocketId = user.socket.id;

    // Join the users to the room
    user.socket.join(roomId);
    bestMatch.socket.join(roomId); 

    // Emit pairing success events 
    user.socket.emit('pairingSuccess', { roomId, strangerGender: bestMatch.userGender, stranger: bestMatch.userEmail });
    bestMatch.socket.emit('pairingSuccess', { roomId, strangerGender: user.userGender, stranger: user.userEmail });
  }
}

function sendMessageToRoom(io, roomId, senderUserId, content) {
  io.to(roomId).emit('message', { type: 'message', sender: senderUserId, content }); 
}

function getPairedUserId(users, io, roomId, userId) {
  const room = io.sockets.adapter.rooms.get(roomId); 

  if (room) {
    for (const id of room) { 
      if (id !== userId && users.has(id)) {
        return id;
      }
    }
  }
  return null;
}

module.exports = { pairUsers, sendMessageToRoom, getPairedUserId };
