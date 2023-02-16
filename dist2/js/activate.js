// TODO: this should be completely changed
$(document).ready(function () {
  const { action } = Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
  );
  if (action === "FORGET_PASSWORD") {
    $("button.button").click(verifyToken);
    $(".timerTarget").hide();
  } else {
    $("button.button").click(onSignup);
    startTimer(60);
  }
  $("input#OTP:first-child").focus();
  $("input#OTP").bind("input", onValidationChanged);
  $("input#OTP").keydown(onKeyPressed);
});
function verifyToken(e) {
  const event = e;
  const code =
    Array.from(document.querySelectorAll("input#OTP"))
      .map((a) => a.value)
      .join("") || "";
  const { email } = Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
  );
  if (code.length < 4) {
    toast("Missing Digits");
    return;
  }
  e.preventDefault();
  if (!email) return window.location.replace("/dist2/login.html");
  fetch(`https://app.loadboardplus.com/api/verify-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, token: code }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.code === 200) {
        document.location.replace(
          `/dist2/change.html?email=${email}&code=${code}&action=RESTORE_PASSWORD`
        );
      } else {
        toast(res.message);
      }
    })
    .catch((err) => toast(err.message));
}
function onSignup(e) {
  const event = e;
  const code =
    Array.from(document.querySelectorAll("input#OTP"))
      .map((a) => a.value)
      .join("") || "";
  const { email } = Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
  );
  if (code.length < 4) {
    toast("Missing Digits");
    return;
  }
  e.preventDefault();
  if (!email) return window.location.replace("/dist2/login.html");
  fetch(`https://app.loadboardplus.com/api/activation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, token: code }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.code === 200) {
        $(".app-main")
          .html(
            `<img src="./images/checked.svg" style="width:80px"/>
         <br/><br/><br/>
        <h2>Verified Successfully</h2>
        <br/>
        <p class="sm-text onSignupP">
            Your email verified successfully! 
            <br/>
            Please wait for the page to refresh 
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
        }, 3e2);
      } else {
        $(".text-error").text(res.message);
      }
    })
    .catch((err) => {
      $(".text-error").text(err.message);
    });
}
function onValidationChanged() {
  this.value = this.value.replace(/[^0-9]/g, "");
  var $this = $(this);
  setTimeout(function () {
    if ($this.val().length >= parseInt($this.attr("maxlength"), 10))
      $this.next("input").val("").focus();
  }, 10);
}
function onKeyPressed(e) {
  if (e.key === "Backspace" && $(this).val().length === 0) {
    $(this).prev("input").val("").focus();
  }
}
function toast(text) {
  $(".text-error").text(text);
}
function startTimer(duration) {
  var timer = duration,
    minutes,
    seconds;
  window["LoadboardCounter"] = setInterval(function () {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    $(".timerTarget").text(`Didn't receive OTP ? ` + minutes + ":" + seconds);
    if (--timer < 0) {
      timer = duration;
      clearInterval(window["LoadboardCounter"]);
      $(".timerTarget").text("Request OTP now!").click(onRequestNewOTP);
    }
  }, 1000);
}
function onRequestNewOTP() {
  const { email } = Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
  );
  fetch(`https://app.loadboardplus.com/api/activation/${email}`)
    .then((res) => res.json())
    .then((res) => {
      $(".timerTarget").off("click", onRequestNewOTP);
      if (res.success) {
        $(".timerTarget").text(res.payload);
        setTimeout(()=>startTimer(60), 2000);
      } else {
        $(".timerTarget").hide();
        $(".text-error").text(res.message);
      }
    })
    .catch(Sentry.captureException);
}
