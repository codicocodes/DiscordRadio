const server_uri = 'discordradio.tk';
const server_port = 80;

Array.prototype.last = function() { return this[this.length - 1]; };

let player, hostPlayerState, autoplayFailHandlerEnabled = false;
document.title = `Listening to: ${window.location.toString().split('/').last()}`;

function onYouTubeIframeAPIReady() {
  new YT.Player('player', {
    height: '100%',
    width: '100%',
    playerVars: {
      iv_load_policy: 3,
      modestbranding: 1,
      origin: `http://${server_uri}:${server_port}`,
      rel: 0,
      disablekb: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    },
  });
}

async function onPlayerReady(readyEvent) {
  console.log('Player ready:', readyEvent);
  player = readyEvent.target;

  const ws = new WebSocket(`ws://${server_uri}:420`);
  ws.onopen = async () => {
    console.log('Sending listener url to the server...');
    ws.send(window.location);
    window.onbeforeunload = () => ws.close();
  };

  ws.onmessage = async (e) => {
    console.log('Received a message from the server...');
    if (!e.data) return;

    hostPlayerState = JSON.parse(e.data);
    hostPlayerState.currTime += (Date.now() - hostPlayerState.updatedOn) / 1000;
    hostPlayerState.initializedOn = Date.now();
    hostPlayerState.videoId = hostPlayerState.URL.match(/[?&]v=([^&]*)/)[1];
    console.log('Received player state:', hostPlayerState);
    
    const currVideoUrl = player.getVideoUrl();
    const currVideoId = (currVideoUrl?.includes('v=')) ? currVideoUrl.match(/[?&]v=([^&]*)/)[1] : undefined;

    if (currVideoId !== hostPlayerState.videoId) loadNewVideo(readyEvent);
    else updatePlayer();
  };

  ws.onerror = (e) => {
    console.log('YouTube has problems. Listen to them: ', e)
  }
}

async function onPlayerStateChange(event) {
  console.log('Player state changed:', event.data);

  if (!autoplayFailHandlerEnabled && event.data === YT.PlayerState.UNSTARTED) {
    autoplayFailHandlerEnabled = true;
    document.addEventListener('click', e => {
      player.playVideo();
    }, { once: true });
  }

  if (event.data === YT.PlayerState.CUED) {
    console.log('Player video ready');

    if (hostPlayerState.paused) event.target.pauseVideo();
    else event.target.playVideo();
  }
}

async function loadNewVideo(readyEvent) {
  console.log('Loading new video...');
  player.cueVideoById(hostPlayerState.videoId, hostPlayerState.currTime);
}

async function updatePlayer() {
  await player.seekTo(hostPlayerState.currTime);

  if (hostPlayerState.paused) player.pauseVideo();
  else player.playVideo();
}

window.addEventListener('keydown', (e) => {
  const playerVolume = player.getVolume();
  let newVolume;
  switch (e.code) {
    case 'ArrowDown':
      newVolume = Math.max((playerVolume - 5), 0)
      player.setVolume(newVolume)
      showSnackbar(`${newVolume}%`)
      break;
    case 'ArrowUp':
      newVolume = Math.min((playerVolume + 5), 100)
      player.setVolume(Math.min((playerVolume + 5), 100))
      showSnackbar(`${newVolume}%`)
      break;
    case 'KeyM':
      if (player.isMuted()) {
        player.unMute();
        showSnackbar('Unmuted')
      }
      else {
        player.mute()
        showSnackbar('Muted')
      }
      break;
    case 'Space':
      if (player.getPlayerState() === 1)
        player.pauseVideo()
      else if (player.getPlayerState() === 2) {
        player.playVideo()

        hostPlayerState.currTime += (Date.now() - hostPlayerState.initializedOn) / 1000;
        player.seekTo(hostPlayerState.currTime);
      }
      break;
  }
})

function showSnackbar(text) {
  const snackbar = document.querySelector('#snackbar')
  snackbar.className = "show"
  snackbar.innerText = text
  setTimeout(function () {
    snackbar.className = "";
  }, 3000);
}
