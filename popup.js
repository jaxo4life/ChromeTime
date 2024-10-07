document.addEventListener('DOMContentLoaded', function() {
  try {
    // 从存储中获取当前设置
    chrome.storage.local.get(['meteorInterval'], function(result) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      if (result.meteorInterval !== undefined) {
        document.getElementById('intervalSelect').value = result.meteorInterval;
      }
    });

    document.getElementById('saveButton').addEventListener('click', () => {
      const interval = document.getElementById('intervalSelect').value;
      // 保存设置到存储
      chrome.storage.local.set({meteorInterval: interval}, function() {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        console.log('Interval is set to ' + interval);
      });
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        chrome.tabs.sendMessage(tabs[0].id, {action: 'updateMeteorInterval', interval: parseInt(interval)});
      });
    });

    document.getElementById('startFlowerMode').addEventListener('click', () => {
      const duration = document.getElementById('flowerDuration').value;
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        chrome.tabs.sendMessage(tabs[0].id, {action: 'startFlowerMode', duration: parseInt(duration)});
      });
      window.close();
    });
  } catch (error) {
    console.error('Failed to initialize popup:', error);
  }
});