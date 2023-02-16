$(document).ready(function () {
  const { prefill_email } = Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
  );
  if (prefill_email) {
    $("#email").val(prefill_email);
    $("#password").focus();
  }
  if (parent !== self)
    $(".onSignupP").html(
      `Don’t have an account? <a href="./signup.html">Sign up</a>`
    );
  $(".form-submit").click(onSignUp);
});
async function onSignUp(e) {
  e.preventDefault();
  const email = $("#email").val();
  const password = $("#password").val();
  if (!email || !password) return;
  $(".wrapper").addClass("isLoading");
  await new Promise((r) => setTimeout(r, 500));
  fetch(`https://app.loadboardplus.com/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })
    .then((res) => res.json())
    .then((res) => {
      $(".wrapper").removeClass("isLoading");
      if (res.success) {
        $(".app-main")
          .html(
            `<img src="./images/checked.svg" style="width:80px"/>
                <br/><br/><br/>
                <h2>Logged in Succesfully</h2>
                <br/>
                    </p>
                `
          )
          .css("justify-content", "center")
          .css("align-items", "center");
        console.log(res.payload);
        setTimeout(() => {
          chrome.runtime.sendMessage({
            name: "REFRESH",
            query: "SET_TOKEN",
            payload: res.payload.keyToken,
          });
        }, 500);
        setTimeout(() => {
          document.location.replace("/dist2/user-account.html");
        }, 1200);
      } else {
        if (res.code === 905) {
          location.replace(`./activate.html?email=${email}`);
        }
        $(".text-error").text(res.message);
      }
    });
}
