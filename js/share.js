let data = {};
$(document).ready(function () {
  chrome.runtime.sendMessage(
    { message: "fetchCurrentShare" },
    function (response) {
      $("#body").val(mail`${response}`);
      data = response;
      $(".copybtn").click(function () {
        navigator.clipboard.writeText($("#body").val());
      });
    }
  );
  $(".calulatorHolder input").on("input", liveCalulator);
  $(".calc").click(function () {
    $(".calulatorHolder").slideToggle("slow", function () {
      $("#dho").val((data.dho && data.dho.replace(/[^0-9.-]+/g, "")) || 0);
      $("#trip").val((data.trip && data.trip.replace(/[^0-9.-]+/g, "")) || "");
      $("#rate").val((data.rate && data.rate.replace(/[^0-9.-]+/g, "")) || "");
      $("#rpm").val((data.rpm && data.rpm.replace(/[^0-9.-]+/g, "")) || "");
      $([document.documentElement, document.body]).animate(
        {
          scrollTop: $("#rpm").offset().top,
        },
        1000
      );
    });
  });
  $("#to").keyup(function () {
    this.setCustomValidity("");
  });
  $("#send").click(function (e) {
    const emailEl = document.querySelector("#to");
    const email = $(emailEl).val();
    if (!email) {
      emailEl.setCustomValidity("Email Required");
    } else if (!validateEmail(email)) {
      emailEl.setCustomValidity("Email is not valid");
    } else {
      emailEl.setCustomValidity("");
    }
    if (document.querySelectorAll("form input:invalid").length > 0) {
      return;
    }
    e.preventDefault();
    chrome.storage.local.get("user", ({ user }) => {
      if (!user.keyToken) {
        alert("Login first");
        return;
      }
      const domain = `https://app.loadboardplus.com`;
      var options = {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          body: $("#body").val(),
          email: $("#to").val(),
          apiKey: user.keyToken,
        }),
      };
      fetch(`${domain}/api/share`, options)
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            chrome.runtime.sendMessage({ message: "emailSent" });
            if ($("#closeAfterSend").is(":checked")) {
              chrome.runtime.sendMessage({
                name: "REFRESH",
                query: "CLOSE_ME",
              });
            }
          } else {
            alert(res.message);
          }
        });
    });
  });
});

// TODO: use this for share/mail
function mail(strings, response) {
  let template = [`Check out the following load:\n`];
  document.title = `Origin : ${response["origin"]} - Destination : ${response["destination"]}`;
  for (const key in response) {
    if (Object.hasOwnProperty.call(response, key)) {
      switch (key) {
        case "company":
          template.push(`Company: ${response[key]}`);
          break;

        case "contact":
          template.push(`Contact: ${response[key]}`);
          break;

        case "destination":
          template.push(`Destination: ${response[key]}`);
          break;

        case "length":
          template.push(`Length: ${response[key]}`);
          break;

        case "dho":
          template.push(`DHO: ${response[key]}`);
          break;

        case "total_miles":
          template.push(`Total Miles: ${response[key]}`);
          break;

        case "comments":
          template.push(`Comments: ${response[key]}`);
          break;

        case "comments1":
          template.push(`Comments1: ${response[key]}`);
          break;

        case "comments2":
          template.push(`Comments2: ${response[key]}`);
          break;

        case "origin":
          template.push(`Origin: ${response[key]}`);
          break;

        case "refId":
          template.push(`Reference ID: ${response[key]}`);
          break;

        case "commodity":
          template.push(`Commodity: ${response[key]}`);
          break;

        case "rate":
          template.push(`Rate: ${response[key]}`);
          break;

        case "rpm":
          template.push(`RPM: ${response[key]}`);
          break;

        case "trip":
          template.push(`Trip: ${response[key]}`);
          break;

        case "weight":
          template.push(`Weight: ${response[key]}`);
          break;

        case "map-link":
          template.push(`Map Link: ${response[key]}`);
          break;
      }
    }
  }

  return template.join("\n");
}
function liveCalulator(e) {
  const currentInput = this.id;
  try {
    if (
      currentInput === "dho" ||
      currentInput === "trip" ||
      currentInput === "rate"
    ) {
      const trip = +$("#trip").val();
      const dho = +$("#dho").val();
      const rate = +$("#rate").val();
      const rpm = rate / (trip + dho);
      $("#rpm").val(rpm.toFixed(2));
    } else {
      const rpm = +$("#rpm").val();
      const trip = +$("#trip").val();
      const dho = +$("#dho").val();
      const rate = rpm * (trip + dho);
      $("#rate").val(rate.toFixed(2));
    }
  } catch (ex) {}
}
function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
