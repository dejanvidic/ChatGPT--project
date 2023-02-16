chrome.storage.local.get(
  [
    "maxMiles",
    "minMiles",
    "minRate",
    "minRPM",
    "dhoEnable",
    "popupAlertEnable",
    "soundEnable",
    "emailList",
    "notifyAll",
    "notifyOnce",
  ],
  (data) => {
    $("#max-miles").val(data.maxMiles !== -1 ? data.maxMiles : "");
    $("#min-miles").val(data.minMiles !== -1 ? data.minMiles : "");
    $("#filter-rate").val(data.minRate !== -1 ? data.minRate : "");
    $("#filter-rpm").val(data.minRPM !== -1 ? data.minRPM : "");

    $("#emailList").val(data.emailList);

    $("#dhoEnable").prop("checked", data.dhoEnable);

    $("#popupAlertEnable").prop("checked", data.popupAlertEnable);
    $("#soundEnable").prop("checked", data.soundEnable);
    $("#notifyAll").prop("checked", data.notifyAll);
    $("#notifyOnce").prop("checked", data.notifyOnce);

    $("#save-filters").click(saveFilters);
    $("#reset-filters").click(resetFilters);
    $("#save-notifications").click(saveNotifications);

    $("#dhoEnable").change(function () {
      chrome.storage.local.set({ dhoEnable: this.checked }, () => {
        $(".btm-lftt").append(
          '<span class="alert alert-success" style="padding: 7.5px;">Updated</span>'
        );

        setTimeout(() => $(".alert-success").remove(), 1000);
      });
    });

    $("#notifyOnce, #notifyAll").change(function () {
      let id = $(this).attr("id");

      if (id == "notifyOnce" && $("#notifyAll").prop("checked")) {
        $("#notifyAll").prop("checked", false);
      } else if (id == "notifyAll" && $("#notifyOnce").prop("checked")) {
        $("#notifyOnce").prop("checked", false);
      }
    });
  }
);

function saveFilters() {
  let maxMiles = parseFloat($("#max-miles").val());
  let minMiles = parseFloat($("#min-miles").val());
  let minRate = parseFloat($("#filter-rate").val());
  let minRPM = parseFloat($("#filter-rpm").val());

  if (isNaN(maxMiles)) {
    maxMiles = -1;
  }

  if (isNaN(minMiles)) {
    minMiles = -1;
  }

  if (isNaN(minRate)) {
    minRate = -1;
  }

  if (isNaN(minRPM)) {
    minRPM = -1;
  }

  const data = {
    maxMiles: maxMiles,
    minMiles: minMiles,
    minRate: minRate,
    minRPM: minRPM,
  };

  chrome.storage.local.set(data, () => {
    $("#status").html(
      '<div class="alert alert-success" style="padding: 7.5px;">Updated</div>'
    );

    setTimeout(() => $("#status").html(""), 1000);
  });
}

function resetFilters() {
  $("#max-miles").val("");
  $("#min-miles").val("");
  $("#filter-rate").val("");
  $("#filter-rpm").val("");

  chrome.storage.local.set(
    { maxMiles: -1, minMiles: -1, minRate: -1, minRPM: -1 },
    () => {
      $("#status").html(
        '<div class="alert alert-success" style="padding: 7.5px;">Updated</div>'
      );

      setTimeout(() => $("#status").html(""), 1000);
    }
  );
}

function saveNotifications() {
  let emailList = $("#emailList").val().split("\n");

  let popupAlertEnable = $("#popupAlertEnable").prop("checked");
  let soundEnable = $("#soundEnable").prop("checked");
  let notifyAll = $("#notifyAll").prop("checked");
  let notifyOnce = $("#notifyOnce").prop("checked");

  chrome.storage.local.set(
    { popupAlertEnable, soundEnable, notifyAll, notifyOnce, emailList },
    () => {
      $("#notification-status").html(
        '<div class="alert alert-success" style="padding: 6px;margin-bottom:0;">Notification setting updated</div>'
      );

      setTimeout(() => $("#notification-status").html(""), 1000);
    }
  );
}

$("#right").hide();

$("li.right").click(function () {
  $(this).addClass("active");
  $("#left").hide();

  $($(this).find("a").attr("href")).show();

  $("li.left").removeClass("active");
});

$("li.left").click(function () {
  $(this).addClass("active");
  $("#right").hide();
  $($(this).find("a").attr("href")).show();

  $("li.right").removeClass("active");
  $("html, body").animate({ scrollTop: 0 }, "slow");
});

$(document).ready(function () {
  $(".checkoutPage").on("click", function () {
    //chrome.tabs.create({ url: "http://localhost/checkout" }, () => {});
  });
});
