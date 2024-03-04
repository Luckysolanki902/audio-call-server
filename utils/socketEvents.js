const { pairUsers, getPairedUserId } = require('./pairingUtils');
const { emitRoundedUsersCount } = require('./countingUtils');

function handleSocketEvents(io, socket, users) {
  let userId = null;

  console.log('A User connected');

  socket.on('identify', (data) => {
    emitRoundedUsersCount(io, users.size);

    const {
      userEmail,
      userGender,
      userCollege,
      preferredGender,
      preferredCollege
    } = data;

    userId = userEmail;

    users.set(userId, {
      socket,
      userEmail,
      userGender,
      userCollege,
      preferredGender,
      preferredCollege,
      isPaired: false,
      room: null,
      pairedSocketId: null // Add for storing paired socket IDs
    });

    console.log('users online are:', users.size);
    pairUsers(userId, users, io);
  });



  socket.on('findNewPair', (data) => {
    emitRoundedUsersCount(io, users.size);

    const user = users.get(userId);
    if (user) {
      const {
        userEmail,
        userGender,
        userCollege,
        preferredGender,
        preferredCollege
      } = data;
      user.userEmail = userEmail;
      user.userGender = userGender;
      user.userCollege = userCollege;
      user.preferredGender = preferredGender;
      user.preferredCollege = preferredCollege;

      if (user.isPaired && user.room && user.pairedSocketId) {
        io.to(user.pairedSocketId).emit('pairDisconnected');

        socket.leave(user.room);
        user.isPaired = false;
        user.room = null;
        user.pairedSocketId = null; // Reset pairedSocketId when unpairing
      }

      // Pair the user with a new partner
      pairUsers(userId, users, io);
    }
  });



// Offer handling on the server
socket.on('offer', (data) => {
  const { from, to, offer } = data;
  console.log('Received offer from', from, 'to', to);
  const sender = users.get(from); // Get the sender's user object
  if (sender && sender.socket) {
      sender.socket.emit('offer', { from, to, offer }); // Forward the offer
      console.log('Forwarding offer to', to, 'from', from);
  }
});

// Answer handling on the server
socket.on('answer', (data) => {
  const { from, to, answer } = data;
  const recipient = users.get(to);

  if (recipient && recipient.socket) {
      recipient.socket.emit('answer', { from, to, answer }); // Forward the answer
      console.log('Forwarding answer to', to);
  }
});

  // Added 'stream' event handling for the server
  socket.on('stream', (data) => {
    const { to, stream } = data;
    console.log('Received stream from', userId, 'to', to);
    const recipient = users.get(to);
    if (recipient && recipient.socket) {
      // Forward the stream to the recipient
      recipient.socket.emit('stream', { from: userId, stream });
      console.log('Forwarding stream to', to, 'from', userId);
    }
  });


  socket.on('disconnect', () => {
    console.log('A User disconnected');
    if (userId && users.has(userId)) {
      const user = users.get(userId);

      if (user.isPaired && user.room && user.pairedSocketId) {
        const pairedUserId = getPairedUserId(users, io, user.room, userId);
        if (pairedUserId && users.has(pairedUserId)) {
          const pairedUser = users.get(pairedUserId);
          try {
            pairedUser.socket.emit('pairDisconnected');
            pairedUser.socket.leave(user.room);
            pairedUser.isPaired = false; // Update pairings status
            pairedUser.room = null;
            pairedUser.pairedSocketId = null;
          } catch (error) {
            console.error('Error handling room cleanup:', error);
          }
        }
      }
      users.delete(userId);
    }
  });
}

module.exports = handleSocketEvents; 
