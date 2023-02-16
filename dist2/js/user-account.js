chrome.runtime.sendMessage({
  name: "REFRESH",
  query: "REQUEST_USERINFO",
});
$(document).ready(function () {
  $(".logout").click(logout);
  chrome.storage.local.get("user", ({ user }) => {
    verifyStorage(user);
  });
  if (parent !== self) {
    $("style#shortPage,style#fitContent").remove();
  }
});
chrome.storage.onChanged.addListener(function (changes) {
  const { user } = changes;
  if (user) {
    verifyStorage(user.newValue);
  }
});
function verifyStorage(user) {
  if (!user) return document.location.replace("./login.html");
  if (!user.email) return document.location.replace("./login.html");
  $("#userMail").text(user.email);
  $(".passwordUpdate").attr("href", `/dist2/change.html?email=${user.email}`);
  if (user.isCancelled) {
    $("#accountStatus").text("Cancelled").css("color", "#df4759");
    $("#autoRenew").text("--");
    $("#managesubs").text("Premuim");
    $("#managePurchase").text("Purchase subscription");
    $(".subscriptionManageIcon").click(goPremuim);
  } else if (user.isPaid) {
    $("#accountStatus").text("Pro").css("color", "#42ba96");
    $("#autoRenew").text(join(new Date(user.subscriptionTill), a, "-"));
    $(".subscriptionManageIcon").attr(
      "href",
      `https://app.loadboardplus.com/api/session?token=${user.keyToken}`
    );
  } else {
    //Trial Version
    let validDate = new Date(user.signup);
    validDate = validDate.addDays(7);
    if (new Date() > validDate) {
      $("#accountStatus").text("Trial Expired").css("color", "#ffeb3b");
    } else {
      const remainDays = Math.ceil(
        (validDate - new Date()) / (1000 * 60 * 60 * 24)
      );
      $("#accountStatus")
        .text(`Free Trial ${remainDays} days left.`)
        .css("color", "#F00");
    }
    $("#managesubs").text("Premuim");
    $("#managePurchase").text("Purchase subscription");
    $(".subscriptionManageIcon").click(goPremuim);
  }
}
function logout(e) {
  e.preventDefault();
  chrome.runtime.sendMessage({
    name: "REFRESH",
    query: "LOGOUT",
  });
}
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};
function goPremuim(e) {
  e.preventDefault();
  chrome.tabs.create(
    { active: true, url: chrome.runtime.getURL("/html/checkout.html") },
    () => {}
  );
}

function manageSubscriptions() {
  chrome.storage.local.get("user", ({ user }) => {
    chrome.tabs.create({
      active: true,
      url: `${domain}/api/session?token=${user.keyToken}`,
    });
  });
}
function join(t, a, s) {
  function format(m) {
    let f = new Intl.DateTimeFormat("en", m);
    return f.format(t);
  }
  return a.map(format).join(s);
}
let a = [{ month: "short" }, { day: "numeric" }, { year: "numeric" }];
