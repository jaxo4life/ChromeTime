let startTime;
let totalTime = 0;
let isTracking = false;

function startTracking() {
  if (!isTracking) {
    startTime = Date.now();
    isTracking = true;
    chrome.alarms.create('updateTime', { periodInMinutes: 1/60 }); // 每秒更新一次
    chrome.alarms.create('hourlyReminder', { periodInMinutes: 60 }); // 每小时提醒一次
  }
}

function stopTracking() {
  if (isTracking) {
    updateTotalTime();
    isTracking = false;
    chrome.alarms.clear('updateTime');
    chrome.alarms.clear('reminder');
  }
}

function updateTotalTime() {
  const currentTime = Date.now();
  totalTime = currentTime - startTime;
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateTime') {
    updateTotalTime();
  } else if (alarm.name === 'hourlyReminder') {
    const hours = Math.floor(totalTime / 3600000);
    if (hours > 0) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'reminder',
            hours: hours
          });
        }
      });
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTime') {
    updateTotalTime();
    sendResponse({ totalTime: totalTime });
  } else if (request.action === 'openPopup') {
    chrome.action.openPopup();
  }
});

chrome.runtime.onStartup.addListener(startTracking);
chrome.runtime.onSuspend.addListener(stopTracking);

// 初始化跟踪
startTracking();