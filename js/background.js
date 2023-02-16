let currentDetails = {};
let _webSocket;
let isRunning;
const window = {};
window["webSocketCount"] = 0;
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};
// function initErrorTracking() {
//   if (!Sentry || !Sentry.init) return setTimeout(initErrorTracking, 100);
//   const { version } = chrome.runtime.getManifest();
//   Sentry.init({
//     dsn: "https://500ae7dd98b64baaae8e94a42ffb6358@o1269819.ingest.sentry.io/6463466",
//     release: version,
//     maxBreadcrumbs: 50,
//   });
// }
// initErrorTracking();
chrome.storage.onChanged.addListener((changes) => {
  const { user } = changes;
  if (user) {
    const { newValue, oldValue } = user;
    if (oldValue && oldValue.email && newValue === null) {
      referesh();
    }
    if (!oldValue && newValue && newValue.email) {
      countReminder();
    }
    _connectSocket();
    if (
      newValue &&
      newValue.isCancelled === true &&
      oldValue &&
      oldValue.isCancelled === false
    ) {
      referesh();
    }
    if (
      newValue &&
      newValue.isCancelled === false &&
      oldValue &&
      oldValue.isCancelled === true
    ) {
      referesh();
    }
    if (
      newValue &&
      newValue.isPaid === true &&
      oldValue &&
      oldValue.isPaid === false
    ) {
      referesh();
    }
  }
});
chrome.runtime.onMessage.addListener((request, sender, sendMessage) => {
  const { name, query, payload } = request;
  if (name === "REFRESH") {
    console.log(request, sender);
    switch (query) {
      case "REQUEST_USERINFO": {
        return verifyUser();
      }
      case "LOGOUT": {
        onLogout();
        referesh();
        if (_webSocket && _webSocket.readyState === WebSocket.OPEN) {
          _webSocket.close();
          _webSocket = null;
        }
        return;
      }
      case "REFRESH": {
        return referesh();
      }
      case "INJECT_CSS": {
        chrome.scripting.insertCSS({
          target: { tabId: sender.tab.id },
          files: ["/css/content.css"],
        });
        break;
      }
      case "CLOSE_ME": {
        chrome.tabs.remove(sender.tab.id);
      }
      case "INJECT_CSS_2": {
        chrome.scripting.insertCSS({
          target: { tabId: sender.tab.id },
          files: ["css/truckersEdge.css", "css/toastr.min.css"],
        });
        break;
      }
      case "SET_WEBSITE_USAGE": {
        if (_webSocket && _webSocket.readyState === WebSocket.OPEN) {
          const { version } = chrome.runtime.getManifest();
          _webSocket.send(
            JSON.stringify({
              query: "SET_WEBSITE",
              website: request.website,
              username: request.username,
              version,
            })
          );
        }
        break;
      }
      case "SET_TOKEN": {
        closeOpeningFrames();
        fetchToken(payload);
      }
      case "CLOSE_WEBSOCKET": {
        if (_webSocket && _webSocket.readyState === WebSocket.OPEN) {
          _webSocket.close();
          _webSocket = null;
        }
        break;
      }
      default: {
        break;
      }
    }
  }
});
function referesh() {
  chrome.tabs.query({}, (tabs) => {
    const _tabs = tabs.filter(
      (tab) =>
        tab.url.indexOf("power.dat.com") !== -1 ||
        tab.url.indexOf("truckersedge.dat.com") !== -1
    );
    _tabs.forEach((tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["/js/Reloader.js"],
      });
    });
  });
}
function closeOpeningFrames() {
  chrome.tabs.query({}, (tabs) => {
    const _tabs = tabs.filter(
      (tab) =>
        tab.url.indexOf("power.dat.com") !== -1 ||
        tab.url.indexOf("truckersedge.dat.com") !== -1
    );
    _tabs.forEach((tab) => {
      chrome.tabs.executeScript(tab.id, {
        code: `
        if(document.querySelector('.LBP__frameContainer')) {
            const container = document.querySelector('.LBP__frameContainer')
            $(container).fadeOut(function(){
                $(container).remove();
            })
        }`,
      });
    });
  });
}
function verifyUserByPeriod(noStart) {
  if (!noStart) verifyUser();
  setTimeout(() => verifyUserByPeriod(), 4 * 60 * 60 * 1000);
}
function onLogout() {
  const domain = "https://app.loadboardplus.com";
  chrome.storage.local.get("user", ({ user }) => {
    if (!user) return;
    fetch(`${domain}/api/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey: user.keyToken }),
    })
      .then((res) => res.json())
      .then((res) => {
        chrome.storage.local.set({ user: null }, () => {});
      })
      .catch((ex) => {
        chrome.storage.local.set({ user: null }, () => {});
      });
  });
}
verifyUserByPeriod(true);
function verifyUser() {
  const domain = "https://app.loadboardplus.com";
  chrome.storage.local.get("user", ({ user }) => {
    if (!user) return;
    fetch(`${domain}/api/whoami`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey: user.keyToken }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          chrome.runtime.setUninstallURL(
            `${domain}/api/uninstall/${user.keyToken}`
          );
          chrome.storage.local.set({ user: res.payload }, () => {});
        } else {
          chrome.storage.local.set({ user: null }, () => {});
        }
      });
  });
}
function verifyStorage(cb) {
  chrome.storage.local.get("user", ({ user }) => {
    if (!user) return;
    if (user.isCancelled) return;
    let valid = false;
    if (user.clientID && user.email) {
      if (user.isPaid) {
        if (new Date(user.subscriptionTill) > new Date()) {
          valid = true;
        }
      } else {
        let validDate = new Date(user.signup);
        validDate = validDate.addDays(7);
        if (new Date() < validDate) {
          valid = true;
        }
      }
      if (valid) cb();
    }
  });
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message == "createShareWindow") {
    chrome.windows.create({
      height: 600,
      width: 500,
      top: 100,
      left: 200,
      type: "popup",
      url: "html/share.html",
    });
    currentDetails = request.data;
  }
  if (request.message == "fetchCurrentShare") {
    sendResponse(currentDetails);
  }
  verifyStorage(() => {
    if (request.message == "setZoomLevel") {
      chrome.tabs.getZoom(sender.tab.id, (zoomFactor) => {
        if (zoomFactor !== 0.9) chrome.tabs.setZoom(sender.tab.id, 0.9);
      });
    } else if (request.message == "playNotification") {
      let audio = new Audio("sounds/notification.mp3");
      audio.play();
    } else if (request.message == "createPopupWindow") {
      chrome.windows.create({
        height: 600,
        width: 500,
        top: 100,
        left: 200,
        type: "popup",
        url: "html/popup-alert.html",
      });
      currentDetails = request.data;
    } else if (request.message == "emailSent") {
      // chrome.tabs.remove(sender.tab.id);
      // chrome.notifications.create(null, {
      //   iconUrl: "icon/icon128.png",
      //   title: "Email Sent",
      //   message: "An email has been sent with the load information.",
      //   type: "basic",
      // });
    }
  });
});

chrome.storage.sync.get({ hasStartedTrial: false }, function (data) {
  //if (!data.hasStartedTrial) {
  var date = new Date();
  date.setDate(date.getDate() + 7);
  chrome.storage.local.set({
    hasStartedTrial: true,
    trialExpiration: date.toString(),
  });
  //}
});

chrome.runtime.onInstalled.addListener((detail) => {
  if (detail.reason == "install") {
    chrome.storage.local.set({
      maxMiles: -1,
      minMiles: -1,
      minRate: -1,
      minRPM: -1,
      dhoEnable: false,
    });
  }
  referesh();
});

chrome.webRequest.onCompleted.addListener(
  (details) => {
    console.log("COmpleted");
    verifyStorage(() => {
      console.log(details);
      if (
        details.url === "https://power.dat.com/search/matches/" ||
        details.url.indexOf("https://power.dat.com/postings/reSearch/") !== -1
      ) {
        chrome.tabs.sendMessage(details.tabId, { status: "searchDone" });
      } else if (
        details.url.includes(
          "https://power.dat.com/search/matches/take/?matchId="
        ) ||
        details.url.includes(
          "https://power.dat.com/postings/matches/take/?matchId="
        )
      ) {
        const id = new URL(details.url).searchParams.get("matchId");
        chrome.tabs.sendMessage(details.tabId, {
          status: "detailsFetched",
          id,
        });
      } else {
        let result = details.url.match(/(match\/)(.*)(?=\/detail)/);
        if (result && result.length == 3)
          chrome.tabs.sendMessage(details.tabId, {
            status: "detailsFetched",
            id: result[2],
          });
      }
    });
  },
  {
    urls: [
      "https://power.dat.com/postings/reSearch/*",
      "https://power.dat.com/search/matches/*",
      "https://freight.api.prod.dat.com/trucker/api/v1/freightMatching/search/*/match/*/detail",
      "https://freight.api.prod.dat.com/trucker-api-web/api/v1/freightMatching/search/*/match/*/detail",
      "https://power.dat.com/postings/matches/take/*",
    ],
  }
);

chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    console.log("Before POST", details);
    verifyStorage(() => {
      console.log("After Storage Verify");
      if (details.method === "POST") {
        chrome.tabs.sendMessage(details.tabId, { status: "searchRequestSent" });
      }
    });
  },
  {
    urls: [
      "https://freight.api.prod.dat.com/trucker/api/v2/freightMatching/search",
      "https://freight.api.prod.dat.com/trucker-api-web/api/v2/freightMatching/search",
    ],
  }
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  verifyStorage(() => {
    if (tab.url.includes("https://truckersedge.dat.com/search-loads")) {
      console.log("tab updated to search loads");
      chrome.tabs.sendMessage(tabId, { status: "searchLoadsPage" });
      if (window["webSocketCount"] >= 5) {
        window["webSocketCount"] = 0;
        _connectSocket();
      }
    } else if (tab.url.includes("https://truckersedge.dat.com/")) {
      console.log("not on search loads");
      chrome.tabs.sendMessage(tabId, { status: "otherPage" });
      if (window["webSocketCount"] >= 5) {
        window["webSocketCount"] = 0;
        _connectSocket();
      }
    }
  });
});
_connectSocket();
function _connectSocket() {
  chrome.storage.local.get("user", ({ user }) => {
    if (user && user.keyToken) {
      if (window["webSocketCount"] >= 5) return;
      if (_webSocket && _webSocket.readyState === WebSocket.OPEN) return;
      const domain = `wss://app.loadboardplus.com/${user.keyToken}`;
      _webSocket = new WebSocket(domain);
      _webSocket.onopen = () => {
        window["webSocketCount"] = 0;
      };
      _webSocket.onerror = (error) => {
        window["webSocketCount"]++;
        console.log(error);
        setTimeout(_connectSocket, 5 * 60 * 1000);
      };
      _webSocket.onmessage = ({ data }) => {
        console.log(`Rx : ${data}`);
        if (data === "UPDATE") setTimeout(verifyUser, 3000);
      };
      _webSocket.onclose = function () {
        setTimeout(_connectSocket, 1000);
      };
    }
  });
}
countReminder();
function countReminder() {
  chrome.storage.local.get("user", ({ user }) => {
    if (!user) return;
    if (user.isPaid) {
      return;
    }
    let validDate = new Date(user.signup);
    validDate = validDate.addDays(7);
    let timeout = validDate - new Date();
    if (timeout > 0) {
      if (isRunning) clearTimeout(isRunning);
      isRunning = setTimeout(disconnect, timeout);
    }
  });
}
function disconnect() {
  chrome.storage.local.get("user", ({ user }) => {
    if (!user) return;
    if (!user.isPaid) return referesh();
  });
}

function fetchToken(token) {
  const domain = "https://app.loadboardplus.com";
  fetch(`${domain}/api/whoami`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ apiKey: token }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        chrome.runtime.setUninstallURL(`${domain}/api/uninstall/${token}`);
        chrome.storage.local.set({ user: res.payload }, () => {
          referesh();
        });
      } else {
        chrome.storage.local.set({ user: null }, () => {});
      }
    });
}
