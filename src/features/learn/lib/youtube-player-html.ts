/**
 * YouTube IFrame API page — stays in-app, no YouTube app handoff.
 */

export function buildYoutubePlayerHtml(videoId: string, startSec = 0): string {
  const id = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
  const start = Math.max(0, Math.floor(startSec));

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html, body, #wrap, #player { margin:0; padding:0; width:100%; height:100%; background:#000; overflow:hidden; }
      iframe { width:100% !important; height:100% !important; }
    </style>
  </head>
  <body>
    <div id="wrap"><div id="player"></div></div>
    <script>
      var player = null;
      var lastQualities = '';
      function post(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }
      function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
          host: 'https://www.youtube-nocookie.com',
          videoId: ${JSON.stringify(id)},
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            controls: 0,
            fs: 0,
            disablekb: 1,
            iv_load_policy: 3,
            cc_load_policy: 0,
            start: ${start},
            origin: 'https://www.youtube-nocookie.com'
          },
          events: {
            onReady: function () {
              post({
                type: 'ready',
                duration: player.getDuration() || 0,
                qualities: player.getAvailableQualityLevels() || []
              });
              try { player.playVideo(); } catch (e) {}
            },
            onStateChange: function (event) {
              post({
                type: 'state',
                state: event.data,
                time: player.getCurrentTime ? player.getCurrentTime() : 0,
                duration: player.getDuration ? player.getDuration() : 0
              });
              if (event.data === 1) {
                var q = player.getAvailableQualityLevels() || [];
                var key = q.join(',');
                if (key !== lastQualities) {
                  lastQualities = key;
                  post({ type: 'qualities', qualities: q });
                }
              }
            },
            onError: function (event) {
              post({ type: 'error', code: event.data });
            }
          }
        });
      }
      window.__cmd = function (raw) {
        if (!player) return;
        var cmd = typeof raw === 'string' ? JSON.parse(raw) : raw;
        try {
          if (cmd.action === 'play') player.playVideo();
          if (cmd.action === 'pause') player.pauseVideo();
          if (cmd.action === 'seek') player.seekTo(cmd.time || 0, true);
          if (cmd.action === 'rate') player.setPlaybackRate(cmd.rate || 1);
          if (cmd.action === 'mute') player.mute();
          if (cmd.action === 'unmute') player.unMute();
          if (cmd.action === 'quality') {
            var q = cmd.quality || 'default';
            if (player.setPlaybackQuality) player.setPlaybackQuality(q);
            if (player.setPlaybackQualityRange) player.setPlaybackQualityRange(q, q);
          }
          if (cmd.action === 'captionsOn') {
            player.loadModule('captions');
            player.setOption && player.setOption('captions', 'reload', true);
          }
          if (cmd.action === 'captionsOff') {
            player.unloadModule('captions');
          }
        } catch (err) {
          post({ type: 'error', message: String(err) });
        }
      };
      setInterval(function () {
        if (!player || !player.getCurrentTime) return;
        post({
          type: 'progress',
          time: player.getCurrentTime() || 0,
          duration: player.getDuration() || 0,
          rate: player.getPlaybackRate ? player.getPlaybackRate() : 1
        });
      }, 500);
      var tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    </script>
  </body>
</html>`;
}

export function isYoutubeAppHandoffUrl(url: string): boolean {
  const value = String(url || '').toLowerCase();
  if (!value) {
    return false;
  }
  if (value.startsWith('intent:') || value.startsWith('vnd.youtube') || value.startsWith('market:')) {
    return true;
  }
  return (
    /youtube\.com\/watch/.test(value) ||
    /youtube\.com\/shorts/.test(value) ||
    /m\.youtube\.com/.test(value) ||
    /youtu\.be\//.test(value)
  );
}
