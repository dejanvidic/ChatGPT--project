$(document).ready(function () {
  $(".btnCancel").click(() => {
    document.location.replace("./user-account.html");
  });
  $(".btnSubmit").click(function (e) {
    const feedback = $(".feedbackMessage").val();
    if (!feedback) return;
    e.preventDefault();
    $($("p").get(1)).text("Thank You");
    $($("p").get(2)).text("Your feedback will help improve our product.");

    chrome.storage.local.get("user", ({ user }) => {
      if (!user) return document.location.replace("./login.html");
      fetch(`https://app.loadboardplus.com/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: feedback,
          email: (user && user.email) || "Unknown",
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          $(".feedback-message").addClass("showup");
          $(".feedback").fadeOut();
          setTimeout(() => {
            document.location.replace("./user-account.html");
          }, 5000);
          $(".feedbackMessage").fadeOut("slow", function () {});
        });
    });
  });
});
