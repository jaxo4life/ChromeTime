let timeDisplay;
let isDragging = false;
let offsetX, offsetY;
let meteorInterval = 10000; // 默认10秒
let meteorIntervalId = null;
let flowerModeInterval = null;

function createTimeDisplay() {
  if (!document.getElementById('chrome-time-tracker')) {
    timeDisplay = document.createElement('div');
    timeDisplay.id = 'chrome-time-tracker';
    timeDisplay.innerHTML = `
      <div class="digital-clock">
        <span class="time hours">00</span>
        <span class="colon">:</span>
        <span class="time minutes">00</span>
        <span class="colon">:</span>
        <span class="time seconds">00</span>
      </div>
    `;
    document.body.appendChild(timeDisplay);
    updateTimeDisplay();
    addDragFunctionality();
    
    // 添加页面点击生成流星的功能
    document.addEventListener('click', createClickMeteor);
    
    // 从存储中获取流星间隔设置
    try {
      chrome.storage.local.get(['meteorInterval'], function(result) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        if (result.meteorInterval !== undefined) {
          updateMeteorInterval(parseInt(result.meteorInterval));
        } else {
          updateMeteorInterval(10000); // 默认为10秒
        }
      });
    } catch (error) {
      console.error('Failed to get meteor interval from storage:', error);
    }
  }
}

function updateTimeDisplay() {
  try {
    chrome.runtime.sendMessage({ action: 'getTime' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      if (response && response.totalTime !== undefined) {
        const hours = Math.floor(response.totalTime / 3600000);
        const minutes = Math.floor((response.totalTime % 3600000) / 60000);
        const seconds = Math.floor((response.totalTime % 60000) / 1000);
        
        timeDisplay.querySelector('.hours').textContent = hours.toString().padStart(2, '0');
        timeDisplay.querySelector('.minutes').textContent = minutes.toString().padStart(2, '0');
        timeDisplay.querySelector('.seconds').textContent = seconds.toString().padStart(2, '0');
      } else {
        console.error('Failed to get time from background script');
      }
    });
  } catch (error) {
    console.error('Failed to send message to get time:', error);
  }
}

function addDragFunctionality() {
  timeDisplay.addEventListener('mousedown', startDragging);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDragging);
}

function startDragging(e) {
  isDragging = true;
  offsetX = e.clientX - timeDisplay.getBoundingClientRect().left;
  offsetY = e.clientY - timeDisplay.getBoundingClientRect().top;
  e.preventDefault(); // 防止文本选择
}

function drag(e) {
  if (isDragging) {
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    timeDisplay.style.left = `${x}px`;
    timeDisplay.style.top = `${y}px`;
    timeDisplay.style.bottom = 'auto';
    timeDisplay.style.right = 'auto';
  }
}

function stopDragging() {
  isDragging = false;
}

function createLineEffect() {
  createMeteor();
}

function createClickMeteor(event) {
  const clockRect = timeDisplay.getBoundingClientRect();
  createMeteor(event.clientX, event.clientY, clockRect.left + clockRect.width / 2, clockRect.top + clockRect.height / 2);
}

function createMeteor(startX, startY, endX, endY) {
  const meteor = document.createElement('div');
  meteor.className = 'meteor';
  document.body.appendChild(meteor);

  if (startX === undefined || startY === undefined) {
    const clockRect = timeDisplay.getBoundingClientRect();
    endX = clockRect.left + clockRect.width / 2;
    endY = clockRect.top + clockRect.height / 2;

    if (Math.random() < 0.5) {
      startX = Math.random() < 0.5 ? -100 : window.innerWidth + 100;
      startY = Math.random() * window.innerHeight;
    } else {
      startX = Math.random() * window.innerWidth;
      startY = Math.random() < 0.5 ? -100 : window.innerHeight + 100;
    }
  }

  meteor.style.left = `${startX}px`;
  meteor.style.top = `${startY}px`;

  const angle = Math.atan2(endY - startY, endX - startX);
  const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

  meteor.style.width = `${length}px`;
  meteor.style.transform = `rotate(${angle}rad)`;

  // 生成随机颜色
  const randomColor = Math.floor(Math.random()*16777215).toString(16);
  meteor.style.background = `linear-gradient(to right, 
    rgba(${parseInt(randomColor.substr(0,2), 16)}, ${parseInt(randomColor.substr(2,2), 16)}, ${parseInt(randomColor.substr(4,2), 16)}, 0) 0%, 
    rgba(${parseInt(randomColor.substr(0,2), 16)}, ${parseInt(randomColor.substr(2,2), 16)}, ${parseInt(randomColor.substr(4,2), 16)}, 0.4) 20%, 
    rgba(255, 255, 255, 0.8) 40%, 
    rgba(255, 255, 255, 1) 50%, 
    rgba(255, 255, 255, 0.8) 60%, 
    rgba(${parseInt(randomColor.substr(0,2), 16)}, ${parseInt(randomColor.substr(2,2), 16)}, ${parseInt(randomColor.substr(4,2), 16)}, 0.4) 80%, 
    rgba(${parseInt(randomColor.substr(0,2), 16)}, ${parseInt(randomColor.substr(2,2), 16)}, ${parseInt(randomColor.substr(4,2), 16)}, 0) 100%
  )`;

  meteor.style.boxShadow = `
    0 0 10px 0 rgba(${parseInt(randomColor.substr(0,2), 16)}, ${parseInt(randomColor.substr(2,2), 16)}, ${parseInt(randomColor.substr(4,2), 16)}, 0.5),
    0 0 5px 0 rgba(255, 255, 255, 0.8)
  `;

  const animation = meteor.animate([
    { opacity: 0, width: '0px' },
    { opacity: 1, width: `${length * 0.6}px`, offset: 0.2 },
    { opacity: 1, width: `${length * 0.8}px`, offset: 0.8 },
    { opacity: 0, width: `${length}px` }
  ], {
    duration: 1500,
    easing: 'ease-in-out'
  });

  animation.onfinish = () => {
    meteor.remove();
  };
}

function showReminder(hours) {
  const reminder = document.createElement('div');
  reminder.id = 'chrome-time-reminder';
  reminder.textContent = `您已使用Chrome ${hours} 小时`;
  document.body.appendChild(reminder);

  setTimeout(() => {
    reminder.remove();
  }, 5000);
}

function updateMeteorInterval(interval) {
  if (meteorIntervalId) {
    clearInterval(meteorIntervalId);
  }
  if (interval > 0) {
    meteorIntervalId = setInterval(createLineEffect, interval);
  }
}

function startFlowerMode(duration) {
  if (flowerModeInterval) {
    clearInterval(flowerModeInterval);
  }
  
  const endTime = Date.now() + duration;
  
  flowerModeInterval = setInterval(() => {
    if (Date.now() > endTime) {
      clearInterval(flowerModeInterval);
      flowerModeInterval = null;
      return;
    }
    
    // 随机生成1到5个流星
    const count = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < count; i++) {
      createMeteor();
    }
  }, 100); // 每100毫秒检查一次，可以根据需要调整
}

try {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    if (request.action === 'reminder') {
      showReminder(request.hours);
    } else if (request.action === 'updateMeteorInterval') {
      updateMeteorInterval(request.interval);
    } else if (request.action === 'startFlowerMode') {
      startFlowerMode(request.duration);
    }
  });

  createTimeDisplay();
  setInterval(updateTimeDisplay, 1000);

  console.log('Content script loaded');
  chrome.runtime.sendMessage({ action: 'getTime' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    console.log('Initial time response:', response);
  });
} catch (error) {
  console.error('Failed to initialize content script:', error);
}