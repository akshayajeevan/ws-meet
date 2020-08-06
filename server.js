const express = require('express');
const app = express();
const server = require('http').Server(app);
const { v4: uuidv4 } = require('uuid');
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: 2
});
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get('/:room', (req, res) => {
  res.render('room', {roomId: req.params.room});
});

// when socket connect
io.on('connection', client => {
  // listen join-room event
  client.on('join-room', (roomId, peerId) => {
    client.join(roomId);
    client.to(roomId).broadcast.emit('user-connected', peerId);

    client.on('message', message => {
      console.log('message event received--- ', message);
      io.to(roomId).emit('send-message', message);
    })
    //send user-disconnected event when socket is disconnect
    client.on('disconnect', () => {
      io.to(roomId).emit('user-disconnected', peerId)
    })
  });
});



server.listen(process.env.PORT || 3030);