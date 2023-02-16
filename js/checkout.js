var createCheckoutSession = function () {
  return new Promise((resolve) => {
    chrome.storage.local.get("user", ({ user }) => {
      fetch("https://app.loadboardplus.com/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: user.keyToken }),
      }).then(async function (result) {
        const json = await result.json();
        return resolve(json);
      });
    });
  });
};
$(document).ready(function () {
  createCheckoutSession().then(function (data) {
    if (data && data.url) {
      window.location.replace(data.url);
    } else {
      alert(
        "An Error occurred while creating session, please contact site admin"
      );
    }
  });
});
