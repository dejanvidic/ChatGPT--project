$(document).ready(function () {
  const { email, action, code } = Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
  );
  if (!email) location.replace("./login.html");
  if (action === "RESTORE_PASSWORD") {
    if (!code) {
      return document.location.replace("/dist2/forget.html");
    }
    $(".app-main.signup>h2").text("Reset Password");
    $("#oldPassword").parent().fadeOut("fast");
    $(".btnSignup").click(resetPassword);
  } else {
    $(".btnSignup").click(onSignup);
  }
});
function resetPassword(e) {
  const { email, code } = Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
  );
  const password = $("#password").val();
  const confirmPassword = $("#confirmPassword").val();
  if (!password || !confirmPassword) return;
  e.preventDefault();
  if (password !== confirmPassword) {
    $(".text-error").text("Passwords do not match");
    return;
  }
  fetch(`https://app.loadboardplus.com/api/recovered/${email}/${code}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, token: code, password }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.code === 200) {
        $(".app-main")
        .html(
          `<img src="./images/checked.svg" style="width:80px"/>
       <br/><br/><br/>
      <h2>Password Update Succesful</h2>
      <br/>
     
          </p>
      `
        )
        .css("justify-content", "center")
        .css("align-items", "center");
        setTimeout(() => {
          chrome.runtime.sendMessage({
            name: "REFRESH",
            query: "SET_TOKEN",
            payload: res.payload,
          });
        }, 1500);
      } else {
        $('.text-error').text(res.message);
      }
    });
}
function onSignup(e) {
  const { email } = Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
  );
  const oldPassword = $("#oldPassword").val();
  const password = $("#password").val();
  const confirmPassword = $("#confirmPassword").val();
  if (!oldPassword || !password || !confirmPassword) return;
  e.preventDefault();
  if (!email) location.replace("./login.html");
  if (password !== confirmPassword) {
    $(".text-error").text("Passwords do not match");
    return;
  }
  fetch(`https://app.loadboardplus.com/api/update-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, oldPassword, password }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        $(".app-main")
          .html(
            `<img src="./images/checked.svg" style="width:80px"/>
         <br/><br/><br/>
        <h2>Password Update Succesful</h2>
        <br/>
        <p class="sm-text onSignupP">
            Your account password has been changed succesfully. you can now login to your account.     
        <!--<a href="./user-account.html" class="sm-text forgot-password"> go to login </a>-->
            </p>
        `
          )
          .css("justify-content", "center")
          .css("align-items", "center");
        setTimeout(() => {
          chrome.runtime.sendMessage({
            name: "REFRESH",
            query: "SET_TOKEN",
            payload: "",
          });
        }, 1500);
      } else {
        $(".text-error").text(res.message);
      }
    });
}
