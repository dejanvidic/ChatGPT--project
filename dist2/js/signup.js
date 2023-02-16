if (parent === self) {
  window.location.replace("./login.html");
}
$(document).ready(function () {
  $(".btnSignup").click(onSignup);
});
function onSignup(e) {
  const email = $("#email").val();
  const password = $("#password").val();
  const confirmPassword = $("#confirmPassword").val();
  if (!email || !password || !confirmPassword) return;
  e.preventDefault();
  if (password !== confirmPassword) {
    $(".text-error").text("Passwords do not match");
    return;
  }
  fetch(`https://app.loadboardplus.com/api/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        location.replace(`./activate.html?email=${email}`);
      } else {
        if (res.code === 416) {
          return $(".text-error").html(
            `${res.message}<br/>Click <a href="./login.html?prefill_email=${email}"> Here </a> to login`
          );
        }
        $(".text-error").text(res.message);
      }
    });
}
