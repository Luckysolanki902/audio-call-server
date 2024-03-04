// utils/countingUtils.js

function emitRoundedUsersCount(io, users) {
    let roundedCount = 0;
    const userCount = users.size;

    roundedCount = userCount + 1
  
    // Emit the rounded user count
    io.emit('roundedUsersCount', roundedCount);
  }
  
  module.exports = { emitRoundedUsersCount };
   