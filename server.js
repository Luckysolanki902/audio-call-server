const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const handleSocketEvents = require('./utils/socketEvents');


const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: '*', // Allow requests from all origins
  methods: ['GET', 'POST'],
}));

const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const users = new Map(); // Store connected users by userId
const rooms = new Map(); // Store active rooms

io.on('connection', (socket) => {
  handleSocketEvents(io, socket, users, rooms);
});

server.listen(1000, () => {
  console.log('Server started');
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});
