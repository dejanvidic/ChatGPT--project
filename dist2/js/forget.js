$(document).ready(function () {
  $(".form-submit").click(onSignUp);
});

async function onSignUp(e) {
  e.preventDefault();
  const email = $("#email").val();
  if (!email) return;
  $(".wrapper").addClass("isLoading");
  await new Promise((r) => setTimeout(r, 500));
  fetch(`https://app.loadboardplus.com/api/recovery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })
    .then((res) => res.json())
    .then((res) => {
      $(".wrapper").removeClass("isLoading");
      if (res.success) {
        $(".app-main")
          .html(
            `<img src="./images/checked.svg" style="width:80px"/>
         <br/><br/><br/>
        <h2>Password Reset Code Sent</h2>
        <br/>
        <p class="sm-text onSignupP">
              A password reset code has been sent to <b>${email}</b>.<br/>  
             <br/>
              <a href="./activate.html?email=${email}&action=FORGET_PASSWORD" class="button form-submit" style="color:#fff;max-width:50%;margin:0 auto;"> Enter OTP </a>
            </p>
        `
          )
          .css("justify-content", "center")
          .css("align-items", "center");
      } else {
        $(".text-error").text(res.message);
      }
    });
}
