chrome.storage.local.get("user", ({ user }) => {
  if (!user) return document.location.replace("./login.html");
  document.location.replace("./user-account.html");
});
