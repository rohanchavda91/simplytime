// ============================================================
//  ChronoDesk — AngularJS Application
// ============================================================

var app = angular.module('clockApp', []);

// ── Shared alarm state service ───────────────────────────────
app.service('AlarmService', function ($rootScope) {
  var svc = this;
  svc.alarms       = [];
  svc.alarmRinging = false;
  svc.ringingTime  = '';
  svc.ringingLabel = '';

  svc.triggerAlarm = function (alarm) {
    alarm.ringing    = true;
    svc.alarmRinging = true;
    svc.ringingTime  = alarm.time;
    svc.ringingLabel = alarm.label || 'Alarm';
    $rootScope.$broadcast('alarmRinging');
    svc.playBeep();
  };

  svc.dismissAlarm = function () {
    svc.alarms.forEach(function (a) { a.ringing = false; });
    svc.alarmRinging = false;
    $rootScope.$broadcast('alarmDismissed');
  };

  svc.playBeep = function () {
    try {
      var ctx  = new (window.AudioContext || window.webkitAudioContext)();
      var gain = ctx.createGain();
      gain.gain.value = 0.5;
      gain.connect(ctx.destination);
      for (var i = 0; i < 6; i++) {
        (function (idx) {
          var osc = ctx.createOscillator();
          osc.connect(gain);
          osc.type = 'sine';
          osc.frequency.value = 880;
          osc.start(ctx.currentTime + idx * 0.55);
          osc.stop (ctx.currentTime + idx * 0.55 + 0.3);
        })(i);
      }
      setTimeout(function () { ctx.close(); }, 4000);
    } catch (e) {}
  };

  svc.playShortBeep = function () {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      osc.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 660;
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
      osc.onended = function () { ctx.close(); };
    } catch (e) {}
  };
});

// ── App Controller ───────────────────────────────────────────
app.controller('AppController', function ($scope, $interval, AlarmService) {
  $scope.activeTab    = 'clock';
  $scope.clockMode    = 'digital';  // global — inherited by all child scopes
  $scope.alarmRinging = false;

  function updateDate () {
    var d      = new Date();
    var days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    $scope.todayDate = days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate();
  }
  updateDate();
  $interval(updateDate, 60000);

  $scope.setTab = function (tab) { $scope.activeTab = tab; };

  $scope.$on('alarmRinging',   function () { $scope.alarmRinging = true;  });
  $scope.$on('alarmDismissed', function () { $scope.alarmRinging = false; });
});

// ── Alarm Popup Controller ───────────────────────────────────
app.controller('AlarmPopupController', function ($scope, AlarmService) {
  $scope.$watch(function () { return AlarmService.ringingTime;  }, function (v) { $scope.ringingAlarmTime  = v; });
  $scope.$watch(function () { return AlarmService.ringingLabel; }, function (v) { $scope.ringingAlarmLabel = v; });
  $scope.dismissAlarm = function () { AlarmService.dismissAlarm(); };
});

// ── Clock Controller ─────────────────────────────────────────
app.controller('ClockController', function ($scope, $interval) {
  $scope.ticks = [0,1,2,3,4,5,6,7,8,9,10,11];
  $scope.pi    = Math.PI;
  $scope.sin   = Math.sin;
  $scope.cos   = Math.cos;

  // Animation state
  $scope.animating = false;
  $scope.animationStartTime = 0;
  $scope.animationDuration = 1000; // 1 second

  var months = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  var days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function pad (n) { return String(n).padStart(2, '0'); }

  function getCurrentAngles () {
    var now = new Date();
    var h = now.getHours(), m = now.getMinutes(), s = now.getSeconds(), ms = now.getMilliseconds();
    return {
      second: (s + ms / 1000) * 6,
      minute: (m + s / 60) * 6,
      hour:   ((h % 12) + m / 60) * 30
    };
  }

  function tick () {
    var now = new Date();
    var h = now.getHours(), m = now.getMinutes(), s = now.getSeconds(), ms = now.getMilliseconds();
    $scope.digitalTime  = pad(h) + ':' + pad(m) + ':' + pad(s);
    $scope.dateStr      = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
    $scope.timezone     = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if ($scope.animating) {
      // Animate from 12:00 to current time
      var elapsed = Date.now() - $scope.animationStartTime;
      var progress = Math.min(elapsed / $scope.animationDuration, 1);
      var easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      
      var targetAngles = getCurrentAngles();
      $scope.secondAngle = targetAngles.second * easeProgress;
      $scope.minuteAngle = targetAngles.minute * easeProgress;
      $scope.hourAngle   = targetAngles.hour   * easeProgress;
      
      if (progress >= 1) {
        $scope.animating = false;
      }
    } else {
      // Normal operation
      $scope.secondAngle  = (s + ms / 1000) * 6;
      $scope.minuteAngle  = (m + s / 60) * 6;
      $scope.hourAngle    = ((h % 12) + m / 60) * 30;
    }
  }

  // Watch for clock mode changes
  $scope.$watch('clockMode', function (newVal, oldVal) {
    if (newVal === 'analog' && oldVal === 'digital') {
      // Start animation when switching to analog
      $scope.animating = true;
      $scope.animationStartTime = Date.now();
      // Reset to 12:00 position
      $scope.secondAngle = 0;
      $scope.minuteAngle = 0;
      $scope.hourAngle = 0;
    }
  });

  tick();
  $interval(tick, 8);
});

// ── Mini Clock Controller (Alarm header) ─────────────────────
app.controller('MiniClockController', function ($scope, $interval) {
  function pad (n) { return String(n).padStart(2, '0'); }
  function tick () {
    var now = new Date();
    var h = now.getHours(), m = now.getMinutes(), s = now.getSeconds(), ms = now.getMilliseconds();
    $scope.miniTime    = pad(h) + ':' + pad(m) + ':' + pad(s);
    $scope.secondAngle = (s + ms / 1000) * 6;
    $scope.minuteAngle = (m + s / 60) * 6;
    $scope.hourAngle   = ((h % 12) + m / 60) * 30;
  }
  tick();
  $interval(tick, 8);
});

// ── Stopwatch Audio Service ──────────────────────────────────
app.service('RunningAudio', function () {
  var AUDIO_SRC = 'sounds/running.mp3';   // ← your stopwatch audio file

  var audio = new Audio(AUDIO_SRC);
  audio.loop   = true;
  audio.volume = 0.6;

  this.play  = function () { audio.currentTime = 0; audio.play().catch(function () {}); };
  this.pause = function () { audio.pause(); };
  this.stop  = function () { audio.pause(); audio.currentTime = 0; };
});

// ── Timer Audio Service ──────────────────────────────────────
app.service('TimerAudio', function () {
  var AUDIO_SRC = 'sounds/tick-tock.wav';  // ← timer audio file

  var audio = new Audio(AUDIO_SRC);
  audio.loop   = true;
  audio.volume = 0.6;

  this.play  = function () { audio.currentTime = 0; audio.play().catch(function () {}); };
  this.pause = function () { audio.pause(); };
  this.stop  = function () { audio.pause(); audio.currentTime = 0; };
});

// ── Stopwatch Controller ─────────────────────────────────────
app.controller('StopwatchController', function ($scope, $interval, RunningAudio) {
  $scope.swTime    = 0;
  $scope.swRunning = false;
  $scope.swHH = '00'; $scope.swMM = '00'; $scope.swSS = '00'; $scope.swMS = '00';

  // For analog dial
  $scope.pi       = Math.PI;
  $scope.sin      = Math.sin;
  $scope.cos      = Math.cos;
  $scope.swTicks60 = [];
  for (var i = 0; i < 60; i++) $scope.swTicks60.push(i);

  $scope.swSecFrac  = 0;   // 0–1 fraction of current minute's seconds
  $scope.swSecAngle = 0;   // 0–360 sweep second hand
  $scope.swMinAngle = 0;   // 0–360 minute hand

  var timer = null;
  function pad (n) { return String(n).padStart(2, '0'); }

  function update () {
    $scope.swTime += 10;
    var t  = $scope.swTime;
    var ms = Math.floor((t % 1000) / 10);
    var ss = Math.floor((t / 1000) % 60);
    var mm = Math.floor((t / 60000) % 60);
    var hh = Math.floor(t / 3600000);
    $scope.swHH = pad(hh);
    $scope.swMM = pad(mm);
    $scope.swSS = pad(ss);
    $scope.swMS = pad(ms);

    // Analog: sweep second hand = seconds within current minute (0–60s → 0–360°)
    var totalSec   = t / 1000;
    var secInMin   = totalSec % 60;
    $scope.swSecFrac  = secInMin / 60;
    $scope.swSecAngle = secInMin * 6;

    // Minute hand = total elapsed minutes mapped to 0–360°
    var totalMin   = totalSec / 60;
    $scope.swMinAngle = (totalMin % 60) * 6;
  }

  $scope.startSW  = function () { $scope.swRunning = true;  timer = $interval(update, 10); RunningAudio.play();  };
  $scope.pauseSW  = function () { $scope.swRunning = false; $interval.cancel(timer);        RunningAudio.pause(); };
  $scope.resumeSW = function () { $scope.swRunning = true;  timer = $interval(update, 10); RunningAudio.play();  };
  $scope.resetSW  = function () {
    $scope.swRunning = false;
    $interval.cancel(timer);
    RunningAudio.stop();
    $scope.swTime = 0;
    $scope.swHH = '00'; $scope.swMM = '00'; $scope.swSS = '00'; $scope.swMS = '00';
    $scope.swSecFrac = 0; $scope.swSecAngle = 0; $scope.swMinAngle = 0;
  };
});

// ── Timer Controller ─────────────────────────────────────────
app.controller('TimerController', function ($scope, $interval, AlarmService, TimerAudio) {
  $scope.timerH = 0; $scope.timerM = 5; $scope.timerS = 0;
  $scope.timerRunning   = false;
  $scope.timerDone      = false;
  $scope.timerRemaining = 0;
  $scope.timerTotal     = 0;
  $scope.timerProgress  = 1;
  $scope.timerDisplay   = '00:00:00';

  // For analog face
  $scope.pi          = Math.PI;
  $scope.sin         = Math.sin;
  $scope.cos         = Math.cos;
  $scope.ticks12     = [0,1,2,3,4,5,6,7,8,9,10,11];
  $scope.timerHourAngle = 0;
  $scope.timerMinAngle  = 0;
  $scope.timerSecAngle  = 0;

  var timer = null;
  function pad (n) { return String(n).padStart(2, '0'); }

  function formatDisplay (sec) {
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    return pad(h) + ':' + pad(m) + ':' + pad(s);
  }

  function updateAngles (sec) {
    var h = Math.floor(sec / 3600) % 12;
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    // Map remaining H:M:S onto clock face (same as reading a clock)
    $scope.timerHourAngle = (h + m / 60) * 30;
    $scope.timerMinAngle  = (m + s / 60) * 6;
    $scope.timerSecAngle  = s * 6;
  }

  function step () {
    $scope.timerRemaining--;
    $scope.timerProgress = $scope.timerTotal > 0 ? $scope.timerRemaining / $scope.timerTotal : 0;
    $scope.timerDisplay  = formatDisplay($scope.timerRemaining);
    updateAngles($scope.timerRemaining);
    if ($scope.timerRemaining <= 0) {
      $interval.cancel(timer);
      $scope.timerRunning   = false;
      $scope.timerDone      = true;
      $scope.timerProgress  = 0;
      $scope.timerHourAngle = 0;
      $scope.timerMinAngle  = 0;
      $scope.timerSecAngle  = 0;
      TimerAudio.stop();
      AlarmService.playShortBeep();
    }
  }

  $scope.startTimer = function () {
    var h = parseInt($scope.timerH) || 0;
    var m = parseInt($scope.timerM) || 0;
    var s = parseInt($scope.timerS) || 0;
    var total = h * 3600 + m * 60 + s;
    if (total <= 0) return;
    $scope.timerTotal     = total;
    $scope.timerRemaining = total;
    $scope.timerProgress  = 1;
    $scope.timerDisplay   = formatDisplay(total);
    $scope.timerRunning   = true;
    $scope.timerDone      = false;
    updateAngles(total);
    TimerAudio.play();
    timer = $interval(step, 1000);
  };

  $scope.pauseTimer  = function () { $scope.timerRunning = false; $interval.cancel(timer); TimerAudio.pause(); };
  $scope.resumeTimer = function () {
    if ($scope.timerRemaining <= 0) return;
    $scope.timerRunning = true;
    TimerAudio.play();
    timer = $interval(step, 1000);
  };
  $scope.resetTimer  = function () {
    $interval.cancel(timer);
    TimerAudio.stop();
    $scope.timerRunning   = false;
    $scope.timerDone      = false;
    $scope.timerRemaining = 0;
    $scope.timerTotal     = 0;
    $scope.timerProgress  = 1;
    $scope.timerDisplay   = '00:00:00';
    $scope.timerHourAngle = 0;
    $scope.timerMinAngle  = 0;
    $scope.timerSecAngle  = 0;
  };
});

// ── Alarm Controller ─────────────────────────────────────────
app.controller('AlarmController', function ($scope, $interval, AlarmService) {
  $scope.alarms        = AlarmService.alarms;
  $scope.newAlarmTime  = '';
  $scope.newAlarmLabel = '';

  function pad (n) { return String(n).padStart(2, '0'); }

  // Extract a clean "HH:MM" string regardless of whether AngularJS
  // gives us a Date object or a plain string from the time input
  function toHHMM (val) {
    if (!val) return null;
    if (val instanceof Date) {
      return pad(val.getHours()) + ':' + pad(val.getMinutes());
    }
    // Plain string from browser — may be "HH:MM" or "HH:MM:SS"
    var parts = String(val).split(':');
    if (parts.length >= 2) return pad(parseInt(parts[0])) + ':' + pad(parseInt(parts[1]));
    return null;
  }

  $scope.addAlarm = function () {
    var hhmm = toHHMM($scope.newAlarmTime);
    if (!hhmm) return;
    AlarmService.alarms.push({
      time: hhmm, label: $scope.newAlarmLabel,
      enabled: true, ringing: false, fired: false
    });
    $scope.newAlarmTime = ''; $scope.newAlarmLabel = '';
  };

  $scope.deleteAlarm = function (idx) { AlarmService.alarms.splice(idx, 1); };

  $interval(function () {
    var now = new Date();
    var cur = pad(now.getHours()) + ':' + pad(now.getMinutes());
    AlarmService.alarms.forEach(function (alarm) {
      if (alarm.enabled && alarm.time === cur && !alarm.fired && !alarm.ringing) {
        alarm.fired = true;
        AlarmService.triggerAlarm(alarm);
      }
      if (alarm.time !== cur) alarm.fired = false;
    });
  }, 1000);
});