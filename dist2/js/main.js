// const inputs = document.querySelectorAll("input");
// if (inputs) {
//   inputs.forEach((el) => {
//     el.addEventListener("focus", (e) => {
//       inputs.forEach(
//         (el) =>
//           el.parentElement.classList.contains("border") &&
//           el.parentElement.classList.remove("border")
//       );
//       e.target.parentElement.classList.add("border");
//     });
//   });
// }

// //Show Message Feedback
// const feedBackForm = document.querySelector(".feedback form");
// const feedbackSection = document.querySelector(".feedback");
// const feedBackMessage = document.querySelector(".feedback-message");
// if (feedBackForm) {
//   feedBackForm.addEventListener("submit", (e) => {
//     e.preventDefault();
//     feedbackSection.style.display = "none";
//     feedBackMessage.classList.add("showup");
//     setTimeout(() => {
//       location.href = "./user-account.html";
//     }, 1000);
//   });
// }

// //Login
// const loginForm = document.querySelector(".login form");
// const loginError = document.querySelector(".login .text-error");
// const fakeDataLogin = {
//   email: "test@gmail.com",
//   password: "test1234",
// };
// if (loginForm) {
//   loginForm.addEventListener("submit", (e) => {
//     e.preventDefault();
//     const emailEl = document.querySelector(".login #email").value;
//     const passEl = document.querySelector(".login #password").value;
//     if (!emailEl || !passEl) {
//       return (loginError.textContent = "Please Provide Email and Password");
//     } else if (
//       emailEl !== fakeDataLogin.email ||
//       passEl !== fakeDataLogin.password
//     ) {
//       return (loginError.textContent = "Invalid Credentials");
//     }
//     loginError.textContent = "";
//     location.href = "user-account.html";
//   });
// }

// //Signup
// const signupForm = document.querySelector(".signup form");
// const signupError = document.querySelector(".signup .text-error");

// if (signupForm) {
//   signupForm.addEventListener("submit", (e) => {
//     e.preventDefault();
//     const emailEl = document.querySelector(".signup #email").value;
//     const passEl = document.querySelector(".signup #password").value;
//     const confirmPassEl = document.querySelector(
//       ".signup #confirmPassword"
//     ).value;
//     if (!emailEl || !passEl || !confirmPassEl) {
//       return (signupError.textContent = "Please Provide Values");
//     } else if (confirmPassEl !== passEl) {
//       return (signupError.textContent = "Password not correct");
//     }
//     signupError.textContent = "";
//     location.href = "user-account.html";
//   });
// }
