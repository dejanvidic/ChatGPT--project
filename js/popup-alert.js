const domain = `http://app.loadboardplus.com`;
$(document).ready(function () {
  chrome.runtime.sendMessage(
    { message: "fetchCurrentShare" },
    function (response) {
      $("#body").val(mail`${response}`);

      $(".copybtn").click(function () {
        navigator.clipboard.writeText($("#body").val());
      });
    }
  );

  $("#send").click(function () {
    chrome.storage.local.get("user", ({ user }) => {
      if (!user.keyToken) {
        alert("Login first");
        return;
      }
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
          } else {
            alert(res.message);
          }
        });
    });
  });
});

function mail(
  strings,
  {
    company,
    contact,
    destination,
    length,
    map_link,
    dho,
    total_miles,
    refId,
    commodity,
    comments1,
    comments2,
    origin,
    rate,
    rpm,
    trip,
    weight,
  }
) {
  let template = [`Check out the following load:\n`];

  if (company.length) template.push(`Company: ${company}`);

  if (contact.length) template.push(`Contact: ${contact}`);

  if (destination.length) template.push(`Destination: ${destination}`);

  if (length.length) template.push(`Length: ${length}`);

  if (dho.length) template.push(`DHO: ${dho}`);

  if (total_miles.length) template.push(`Total Miles: ${total_miles}`);

  if (comments1.length) template.push(`Comments1: ${comments1}`);

  if (comments2.length) template.push(`Comments2: ${comments2}`);

  if (origin.length) template.push(`Origin: ${origin}`);

  if (refId.length) template.push(`Reference ID: ${refId}`);

  if (commodity.length) template.push(`Commodity: ${commodity}`);

  if (rate.length) template.push(`Rate: ${rate}`);

  if (rpm.length) template.push(`RPM: ${rpm}`);

  if (trip.length) template.push(`Trip: ${trip}`);

  if (weight.length) template.push(`Weight: ${weight}`);

  if (map_link.length) template.push(`Map Link: ${map_link}`);

  return template.join("\n");
}
