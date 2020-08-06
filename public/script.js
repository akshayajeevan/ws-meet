const socket = io();
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {}
let myVideoStream;

//since peer is going to create id, so no need to mention any here
var peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
});

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);

  peer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    })
  });

  socket.on('user-connected', peerId => {
    connectToNewUser(peerId, stream);
  });
  let msgInput = $('input');
  $('html').keydown(e => {
    // when pressed enter
    if (e.which == 13 && msgInput.val().length !== 0) {
      console.log('going to emit message---', msgInput.val());
      socket.emit('message', msgInput.val());
      msgInput.val('');
    }
  });

  socket.on('send-message', message => {
    console.log('incoming message...', message)
    $('.messages').append(`<li class="mesage"><b>User</b><br>${message}</li>`);
    scrollToBottom();
  });
});
//listen user-disconnected event & close call
socket.on('user-disconnected', peerId => {
  if (peers[peerId]) peers[peerId].close()
});

//when peer opens a connection, it creates an id
peer.on('open', id => {
  // peer id who is connecting a room
  socket.emit('join-room', ROOM_ID, id);
});

peer.on('error', err => {
  console.error(err);
});

/**
 * connect to incoming new user
 */
const connectToNewUser = (peerId, stream) => {
  //new user calls with id and peer's video stream
  const call = peer.call(peerId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  })

  //remove video element when peer call is closed
  call.on('close', () => {
    video.remove();
  })

  peers[peerId] = call
}

/**
 * show video streams
 */
const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  })
  videoGrid.append(video);
};

/**
 * show the latest on bottom of chat window
 */
const scrollToBottom = () => {
  let chatWindow = $('.main_chat_window');
  chatWindow.scrollTop(chatWindow.prop('scrollHeight'));
}

/**
 * toggle microphone mute
 */
const toggleMute = () => {
  const isMute = myVideoStream.getAudioTracks()[0].enabled;
  if(isMute) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteBtn();
  } else {
    setMuteBtn();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

/**
 * show mute icon when unmuted
 */
const setMuteBtn = () => {
  const muteHtml = `
  <i class="fas fa-microphone"></i>
  <span>Mute</span>
  `
  document.querySelector('.main_mute_btn').innerHTML = muteHtml;
}

/**
 * show unmute icon when muted
 */
const setUnmuteBtn = () => {
  const unMuteHtml = `
  <i class="unmute fas fa-microphone-slash"></i>
  <span>Unmute</span>
  `
  document.querySelector('.main_mute_btn').innerHTML = unMuteHtml;
}

/**
 * toggle my video stream
 */
const toggleMyVideo = () => {
  const isVideoEnabled = myVideoStream.getVideoTracks()[0].enabled;
  if(isVideoEnabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

/**
 * show disable video icon
 */
const setPlayVideo = () => {
  const muteHtml = `
  <i class="unmute fas fa-video-slash"></i><span>Video</span>
  `
  document.querySelector('.main_video_btn').innerHTML = muteHtml;
}

/**
 * show video icon to enable
 */
const setStopVideo = () => {
  const muteHtml = `
  <i class="fas fa-video"></i><span>Video</span>
  `
  document.querySelector('.main_video_btn').innerHTML = muteHtml;
}

/**
 * leave connected room sending disconnect event
 */
const leaveMeeting = () => {
  socket.emit('disconnect', ROOM_ID);
}