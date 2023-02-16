let filters = {
  maxMiles: "",
  minMiles: "",
  minRPM: "",
  minRate: "",
  dhoEnable: true,
};
const shareIcon = chrome.runtime.getURL("img/copy.png");
const shareDarkIcon = chrome.runtime.getURL("img/share_dark.png");
let origin = new URLSearchParams(window.location.search).get("origin");
let shareClicked = false;
let observer;
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};
// function initErrorTracking() {
//   if (!Sentry || !Sentry.init) return setTimeout(initErrorTracking, 100);
//   const { version } = chrome.runtime.getManifest();
//   Sentry.init({
//     dsn: "https://500ae7dd98b64baaae8e94a42ffb6358@o1269819.ingest.sentry.io/6463466",
//     release: version,
//     maxBreadcrumbs: 50,
//   });
//   $(window).on("error", function (e) {
//     Sentry.captureEvent(e);
//   });
// }
// initErrorTracking();
function attachObserver() {
  const target = document.querySelector("body");

  if (target && observer === undefined) {
    observer = new MutationObserver(searchWatcher);
    observer.observe(target, { childList: true, subtree: true });
    console.log("Observer attached");

    if (origin && origin !== "") {
      console.log("origni found", origin);

      setTimeout(() => {
        window.history.pushState({}, document.title, "/search-loads");

        origin = origin.replace(",", ", ");

        const originInput = document.getElementById("searchform-city-origin");
        const config = { bubbles: true, cancelable: true };

        originInput.dispatchEvent(new Event("focus"));

        originInput.dispatchEvent(new Event("keydown"));

        originInput.dispatchEvent(new Event("textInput", config));

        $("#searchform-city-origin").val(origin);

        originInput.dispatchEvent(new Event("input", config));

        originInput.dispatchEvent(new Event("keyup", config));

        originInput.dispatchEvent(new Event("blur", config));

        setTimeout(() => {
          document.getElementById("searchform-search").click();
        }, 3000);
      }, 5000);
    }
  }
}

function searchWatcher(mutationsList, observer) {
  for (const mutation of mutationsList) {
    let isChildList = mutation.type == "childList";
    let nodesAdded = mutation.addedNodes.length > 0;
    let nodesNotRemoved = mutation.removedNodes.length == 0;
    let hasRightTarget = mutation.target?.classList.contains(
      "cdk-virtual-scroll-content-wrapper"
    );

    if (isChildList && nodesAdded && nodesNotRemoved && hasRightTarget) {
      const resultItem = $(mutation.addedNodes[0]).find(
        "[id|='search-card-row']"
      );

      if (resultItem.length > 0 && !resultItem.data("lbp-checked")) {
        resultItem.data("lbp-checked", true);
        processResultItem(resultItem);
      }
    }
  }
}

function reloadFilters() {
  console.log("filters reloaded");
  const searchOrigin = getSearchOrigin();

  chrome.storage.local.get(searchOrigin, (data) => {
    if (data[searchOrigin]) {
      filters = data[searchOrigin];
    } else {
      filters = {
        maxMiles: "",
        minMiles: "",
        minRPM: "",
        minRate: "",
        dhoEnable: true,
      };
    }

    $("#lbp-max-miles").val(filters.maxMiles ?? "");
    $("#lbp-min-miles").val(filters.minMiles ?? "");
    $("#lbp-min-rpm").val(filters.minRPM ?? "");
    $("#lbp-min-rate").val(filters.minRate ?? "");
    $("#lbp-dho-enable").prop("checked", filters.dhoEnable);
  });
}

function addMenuToggler() {
  if (document.querySelector(".lbp-menu-toggle")) {
    return;
  }
  let togglerInterval = setInterval(() => {
    if ($("mat-sidenav").length > 0 && $("#lbp-menu-toggle").length === 0) {
      clearInterval(togglerInterval);

      $("mat-sidenav").data("lbp-side-hidden", false);

      $(".oneweb-header-text")
        .html(`<button color="primary" id="lbp-menu-toggle" mat-raised-button class="mat-raised-button mat-primary">
                            <span class="mat-button-wrapper">Hide Menu</span>
                            <div class="mat-button-ripple mat-ripple" matripple=""></div>
                            <div class="mat-button-focus-overlay"></div>
                        </button> `);

      $("#lbp-menu-toggle").click(function () {
        $("mat-sidenav").toggle();

        const buttonOffer = $("#sort-header").find(".btn-offer");

        if ($("mat-sidenav").data("lbp-side-hidden")) {
          $("mat-sidenav").data("lbp-side-hidden", false);
          $("mat-sidenav-content").css({ "margin-left": "212px" });
          $("#lbp-menu-toggle").find(".mat-button-wrapper").text("Hide Menu");
          buttonOffer.css({ "margin-left": "auto" });
        } else {
          buttonOffer.css({ "margin-left": "200px" });
          $("mat-sidenav").data("lbp-side-hidden", true);
          $("mat-sidenav-content").css({ "margin-left": "0" });
          $("#lbp-menu-toggle").find(".mat-button-wrapper").text("Show Menu");
        }
      });
    }
  }, 100);
}

function updateColumnHeaders() {
  const buttonOffer = $("#sort-header").find(".btn-offer");

  if (buttonOffer.length > 0) {
    if ($("mat-sidenav").data("lbp-side-hidden") === true) {
      buttonOffer.css({ "margin-left": "200px" });
    } else {
      buttonOffer.css({ "margin-left": "auto" });
    }
  }

  if ($(".lbp-share-column").length === 0) {
    // $("#sort-header").find(".sort-items-group").last()
    //   .append(`<div class="sort-button btn-book-now ng-star-inserted lbp-share-column">
    //                 <span _ngcontent-nhx-c37 class="ng-star-inserted" style="font-size:10px;"> SHARE </span>
    //             </div>`);
  }
}
var multiSelect;
async function appendFilters() {
  if ($(".lbp-filters-container").length === 0) {
    $("#search-tools")
      .after(
        `<div class="lbp-filters-container">
        <input id="lbp-max-miles" type="number" min="1" title="Max Miles" placeholder="Max Miles" class="lbp-item">
        <input id="lbp-min-miles" type="number" min="1" title="Min Miles" placeholder="Min Miles" class="lbp-item">
        <input id="lbp-min-rate" type="number" min="1" title="Min Rate" placeholder="Min Rate" class="lbp-item">
        <input id="lbp-min-rpm" type="number" min="0.01" step="0.01" title="Min RPM" placeholder="Min RPM" class="lbp-item">
        <select id="LBP__IgnoreStates"></select>
        <button type="button" id="lbp-apply-filters" title="Apply Filters">Apply Filters</button>
        <button type="button" id="lbp-reset-filters" title="Clear Filters">Clear Filters</button>
        <input type="checkbox" id="lbp-dho-enable" ${
          filters.dhoEnable ? "checked" : ""
        }>
        <label class="lbp-container" id="lbp__labelRPM" title="Include DHO in RPM Calculation" for="lbp-dho-enable">
          <span class="lbp__switcher"></span>
          </label>
          <span class="lbp__checkTarget">${
            filters.dhoEnable ? "RPM+" : "RPM"
          }</span>
          <img src="${chrome.runtime.getURL(
            "/img/icon128.png"
          )}" data-page="user-account.html" class="LBP__ICON"/>
        </div>`
      )
      .ready(function () {
        $(".LBP__ICON").click(injectAppLogin);

        $("#lbp-max-miles,#lbp-min-miles,#lbp-min-rate,#lbp-min-rpm").on(
          "keyup",
          function (e) {
            console.log("Keyup function", e.keyCode, e.key);
            if (e.key === "Enter" || e.keyCode === 13) {
              applyFilters();
            }
          }
        );
        multiSelect = new IconicMultiSelect({
          select: "#LBP__IgnoreStates",
          placeholder: "Ignore States...",
          noData: "No state found.",
          noResults: "No results.",
          data: States,
          textField: "name",
          valueField: "id",
        });
        multiSelect.prefix = "LBP__";
        multiSelect.init();
        multiSelect.subscribe(function () {
          applyFilters();
        });
        $(`*`).click(function (e) {
          const { target } = e;
          const classes = target.getAttribute("class");
          if (classes && classes.indexOf("LBP__") !== -1) {
            e.stopPropagation();
            return;
          }
          multiSelect._closeList();
        });
        $("#lbp-apply-filters").click(applyFilters);
        $("#lbp-reset-filters").click(resetFilters);
        $("#lbp-dho-enable").change(togglDHO);
        $("#lbp-dho-enable").change(function () {
          $(".lbp__checkTarget").text(this.checked ? "RPM+" : "RPM ");
        });
      });
  }
}

function togglDHO() {
  if ($(this).prop("checked")) {
    filters.dhoEnable = true;
  } else {
    filters.dhoEnable = false;
  }
  $(".lbp__checkTarget").text($(this).prop("checked") ? "RPM+" : "RPM ");
  const searchOrigin = getSearchOrigin();
  const data = {};
  data[searchOrigin] = filters;

  chrome.storage.local.set(data, () => {
    $("[id|='search-card-row']").each((index, element) =>
      filterRecord(element)
    );
    success("RPM recalculated successfully");
  });
}

function processResultItem(resultItem) {
  if (
    document.querySelector(
      ".divider.results-detail-container-mobile.wait-container"
    )
  )
    return setTimeout(() => processResultItem(resultItem), 500);
  addDataItems(resultItem);

  // addMapLink(resultItem);

  addRPM(resultItem);
  addRPMPlus(resultItem);
  addShareIcon(resultItem);

  filterRecord(resultItem);

  addDestinationLink(resultItem);

  resultItem.click(activeRowUpdate.bind(resultItem));

  // sendNotificationRequest(resultItem);
}

function addDataItems(resultItem) {
  let dho = resultItem
    .find(".origin-destination-deadhead")
    .first()
    .text()
    .replace(/[^0-9.-]+/g, "");
  resultItem.data("lbp-dho", dho);

  let miles = resultItem
    .find(".trip-cell")
    .text()
    .replace(/[^0-9.-]+/g, "");
  resultItem.data("lbp-miles", miles);

  let rate = resultItem
    .find(".rate-cell")
    .text()
    .replace(/[^0-9.-]+/g, "");
  resultItem.data("lbp-rate", rate);

  let origin = resultItem.find(".origin-locale").text();
  resultItem.data("lbp-origin", origin);

  let destination = resultItem.find(".destination-locale").text();
  resultItem.data("lbp-destination", destination);

  let company = resultItem
    .find(".contact-address")
    .find(".contact-link")
    .text();
  resultItem.data("lbp-company", company);

  let contact = resultItem.find(".contact-phone-email").text();
  resultItem.data("lbp-contact", contact);

  resultItem.data("lbp-has-detail", false);
}

function addMapLink(resultItem) {
  const origin = resultItem.data("lbp-origin");
  const destination = resultItem.data("lbp-destination");

  const mapLink = encodeURI(
    `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
  );

  resultItem.find(".trip-cell").find("a").before(`
  <div class="map-link" style="">
                <a href="${mapLink}" target="_blank">
                    <img style="width: 20px;height: 20px;" src="${chrome.runtime.getURL(
                      "img/map.png"
                    )}">
                </a>
            </div>`);

  resultItem.data("lbp-map-link", mapLink);
}

function addShareIcon(resultItem) {}

function shareLoad() {
  if (
    document.querySelector(
      ".divider.results-detail-container-mobile.wait-container"
    )
  )
    return setTimeout(shareLoad.bind(this), 500);
  if (this.data("lbp-has-detail")) {
    let data = getLoadData.call(this);
    const _message = mail(data);
    navigator.clipboard.writeText(_message);
    success("Load Copied");
    // chrome.runtime.sendMessage({ message: "createShareWindow", data });
  } else {
    shareClicked = true;
    console.log("waiting for response...");
  }
}

function mail(response) {
  let template = [`Check out the following load:\n`];
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
          const _ = (s = "") => s.replace(/(\$|\/mi)/gim, "");
          template.push(
            `RPM: $${truncateToDecimals(
              _(response["rpmRegular"])
            )}/mi    RPM+: $${truncateToDecimals(_(response["rpmPlus"]))}/mi`
          );
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
function addRPMPlus(resultItem) {
  const rate = +resultItem.data("lbp-rate");
  const miles = +resultItem.data("lbp-miles");
  const dho = +resultItem.data("lbp-dho");
  const rpmPlus = (rate / (dho + miles)).toFixed(2);
  resultItem.data("lbp-rpmPlus", rpmPlus);
}
function addRPM(resultItem) {
  if (
    resultItem.data("lbp-rate") !== "" &&
    resultItem.data("lbp-miles") !== ""
  ) {
    let rpm = 0;

    let dho = parseInt(resultItem.data("lbp-dho"));

    if (dho && filters.dhoEnable) {
      rpm += dho;
    }

    let miles = parseInt(resultItem.data("lbp-miles"));

    if (miles) {
      rpm += miles;
    }

    let rate = parseInt(resultItem.data("lbp-rate"));

    let finalVal = truncateToDecimals(rate / rpm);

    if (isFinite(finalVal) && rate) {
      rpm = "" + finalVal + "";
    } else {
      rpm = "";
    }
    if (!miles) rpm = "";
    let rpmMarkup = `<div class="DAT-caption-one liverate" fxlayout="row" style="flex-direction: row; 
                                box-sizing: border-box; display: flex;">
                            ${!rpm ? "-" : "$" + rpm + "/mi"}
                        </div>`;

    if (resultItem.find(".liverate").length === 0) {
      resultItem.find(".rate-cell").append(rpmMarkup);
    } else {
      resultItem.find(".liverate").html(rpmMarkup);
    }

    resultItem.data("lbp-rpm", rpm);
  } else {
    resultItem.data("lbp-rpm", "-");
  }

  if (resultItem.find(".card-selected").length > 0) {
    resultItem.find(".liverate").css({ color: "white" });
  }
}

function activeRowUpdate() {
  $(".liverate").css({ color: "black" });
  this.find(".liverate").css({ color: "white" });

  $('[id|="lbp-share-search-card-row"]').find("img").attr("src", shareIcon);
  this.find('[id|="lbp-share-search-card-row"]')
    .find("img")
    .attr("src", shareDarkIcon);
}

function getRate(resultItem) {
  return new Promise((resolve, reject) => {
    let rate = $(resultItem).find(".rate-cell").children().first();
    let rate_value = Number(rate.text().replace(/[^0-9\.]+/g, ""));

    if (rate_value && rate_value !== 0 && filters.minRate !== "") {
      if (rate_value >= Number(filters.minRate)) {
        resolve({ satisfy: true });
      } else {
        resolve({ satisfy: false });
      }
    } else {
      resolve({ satisfy: false });
    }
  });
}

function getMiles(resultItem) {
  return new Promise((resolve, reject) => {
    const trackLink = $(resultItem).find(".trip-cell");

    let miles = parseFloat(trackLink.text().replace(/\D/g, ""));

    if (filters.minMiles !== "" && filters.maxMiles !== "") {
      if (
        miles >= Number(filters.minMiles) &&
        miles <= Number(filters.maxMiles)
      ) {
        resolve({ satisfy: true });
      } else {
        resolve({ satisfy: false });
      }
    } else {
      if (filters.minMiles !== "" && miles >= Number(filters.minMiles)) {
        resolve({ satisfy: true });
      } else if (filters.maxMiles !== "" && miles <= Number(filters.maxMiles)) {
        resolve({ satisfy: true });
      } else {
        resolve({ satisfy: false });
      }
    }
  });
}

function getLoadData() {
  const payload = {};

  if (this.data("lbp-origin") !== "") {
    payload["origin"] = this.data("lbp-origin");
  }

  if (this.data("lbp-destination") !== "") {
    payload["destination"] = this.data("lbp-destination");
  }

  if (this.data("lbp-dho") !== "") {
    payload["dho"] = this.data("lbp-dho");
  }

  if (this.data("lbp-refId")) {
    payload["refId"] = this.data("lbp-refId");
  }

  if (this.data("lbp-rate") !== "") {
    payload["rate"] = this.data("lbp-rate");
  }

  if (this.data("lbp-rpm") !== "-") {
    payload["rpm"] = this.data("lbp-rpm");
  }

  if (this.data("lbp-length")) {
    payload["length"] = this.data("lbp-length");
  }

  if (this.data("lbp-commodity")) {
    payload["commodity"] = this.data("lbp-commodity");
  }

  if (this.data("lbp-comments")) {
    payload["comments"] = this.data("lbp-comments");
  }

  if (this.data("lbp-contact")) {
    payload["contact"] = this.data("lbp-contact");
  }

  if (this.data("lbp-weight")) {
    payload["weight"] = this.data("lbp-weight");
  }

  if (this.data("lbp-company")) {
    payload["company"] = this.data("lbp-company");
  }

  if (this.data("lbp-miles") !== "") {
    payload["trip"] = this.data("lbp-miles");
  }

  if (this.data("lbp-dho") !== "" && this.data("lbp-miles") !== "") {
    let value_dho = parseInt(this.data("lbp-dho"));
    let value_trip = parseInt(this.data("lbp-miles"));

    payload["total_miles"] = `${value_dho + value_trip}`;
  }

  if (this.data("lbp-map-link") !== "") {
    payload["map-link"] = this.data("lbp-map-link");
  }
  const rate = parseFloat(this.data("lbp-rate"));
  const trip = parseFloat(this.data("lbp-miles"));
  const dho = parseInt(this.data("lbp-dho"));
  if (trip + dho != 0) {
    payload["rpmPlus"] = truncateToDecimals(rate / (dho + trip));
    payload["rpmRegular"] = truncateToDecimals(rate / trip);
  } else {
    payload["rpmPlus"] = "---";
  }
  // console.log(this.data());
  // console.log(payload);
  return payload;
}

function applyFilters() {
  filters.maxMiles = $("#lbp-max-miles").val();
  filters.minMiles = $("#lbp-min-miles").val();
  filters.minRPM = $("#lbp-min-rpm").val();
  filters.minRate = $("#lbp-min-rate").val();

  const searchOrigin = getSearchOrigin();

  const data = {};
  data[searchOrigin] = filters;

  chrome.storage.local.set(data, () => {
    $("[id|='search-card-row']").each((index, element) =>
      filterRecord(element)
    );
    success("Filter applied successfully");
  });
}
function getStates(resultItem) {
  const state = $(resultItem).find(".destination-locale").text() || "";
  const selectedStates = multiSelect?.selectedOptions;
  if (selectedStates && selectedStates.length > 0) {
    const matchState = selectedStates.find(
      (s) => state.indexOf(s.value) !== -1
    );
    return !!matchState;
  } else {
    return false;
  }
}
function filterRecord(resultItem) {
  addRPM($(resultItem));
  addRPMPlus($(resultItem));
  let rpm = $(resultItem)
    .data("lbp-rpm")
    .replace(/[^0-9\.]+/g, "");

  let rpmSatisfy = false;

  if (rpm !== "" && filters.minRPM !== "") {
    rpm = Number(rpm);
    rpmSatisfy = rpm >= Number(filters.minRPM);
  }

  const rate = getRate(resultItem);
  const miles = getMiles(resultItem);
  const igS = getStates(resultItem);
  if (igS) {
    return $(resultItem).removeAttr("style");
  }
  if (
    filters.minRPM !== "" &&
    filters.minRate !== "" &&
    (filters.maxMiles !== "" || filters.minMiles !== "")
  ) {
    if (rpmSatisfy && rate.satisfy && miles.satisfy) {
      $(resultItem).css({ "background-color": "#D4EDDA" });
    } else {
      $(resultItem).removeAttr("style");
    }
  } else if (filters.minRPM !== "" && filters.minRate !== "") {
    if (rpmSatisfy && rate.satisfy) {
      $(resultItem).css({ "background-color": "#D4EDDA" });
    } else {
      $(resultItem).removeAttr("style");
    }
  } else if (
    filters.minRPM !== "" &&
    (filters.maxMiles !== "" || filters.minMiles !== "")
  ) {
    if (rpmSatisfy && miles.satisfy) {
      $(resultItem).css({ "background-color": "#D4EDDA" });
    } else {
      $(resultItem).removeAttr("style");
    }
  } else if (
    filters.minRate !== "" &&
    (filters.maxMiles !== "" || filters.minMiles !== "")
  ) {
    if (rate.satisfy && miles.satisfy) {
      $(resultItem).css({ "background-color": "#D4EDDA" });
    } else {
      $(resultItem).removeAttr("style");
    }
  } else if (filters.minRate !== "") {
    if (rate.satisfy) {
      $(resultItem).css({ "background-color": "#D4EDDA" });
    } else {
      $(resultItem).removeAttr("style");
    }
  } else if (filters.minRPM !== "") {
    if (rpmSatisfy) {
      $(resultItem).css({ "background-color": "#D4EDDA" });
    } else {
      $(resultItem).removeAttr("style");
    }
  } else if (filters.maxMiles !== "" || filters.minMiles !== "") {
    if (miles.satisfy) {
      $(resultItem).css({ "background-color": "#D4EDDA" });
    } else {
      $(resultItem).removeAttr("style");
    }
  } else {
    $(resultItem).removeAttr("style");
  }
}

function getMiles(resultItem) {
  let miles = $(resultItem)
    .data("lbp-miles")
    .replace(/[^0-9\.]+/g, "");

  if (miles === "" || (filters.minMiles === "" && filters.maxMiles === ""))
    return { satisfy: false };

  miles = Number(miles);

  if (filters.minMiles !== "" && filters.maxMiles !== "") {
    if (
      miles >= Number(filters.minMiles) &&
      miles <= Number(filters.maxMiles)
    ) {
      return { satisfy: true };
    }
    return { satisfy: false };
  }

  if (filters.minMiles !== "" && miles >= Number(filters.minMiles))
    return { satisfy: true };

  if (filters.maxMiles !== "" && miles <= Number(filters.maxMiles))
    return { satisfy: true };

  return { satisfy: false };
}

function getRate(resultItem) {
  let rate = $(resultItem)
    .data("lbp-rate")
    .replace(/[^0-9\.]+/g, "");

  if (rate === "" || filters.minRate === "") return { satisfy: false };

  rate = Number(rate);

  if (rate >= Number(filters.minRate)) {
    return { satisfy: true };
  }

  return { satisfy: false };
}

function resetFilters() {
  $("#lbp-max-miles").val("");
  $("#lbp-min-miles").val("");
  $("#lbp-min-rpm").val("");
  $("#lbp-min-rate").val("");

  filters.maxMiles = "";
  filters.minMiles = "";
  filters.minRPM = "";
  filters.minRate = "";

  const searchOrigin = getSearchOrigin();

  const data = {};
  data[searchOrigin] = filters;

  chrome.storage.local.set(data, () => {
    $("[id|='search-card-row']").each((index, element) =>
      filterRecord(element)
    );
    success("Filters cleared successfully");
  });
}

function truncateToDecimals(num, dec = 2) {
  const calcDec = Math.pow(10, dec);
  return (Math.trunc(num * calcDec) / calcDec).toFixed(2);
}

function appendDetails(resultItem) {
  if ($("#detail-referenceid").find(".no-value").length == 0) {
    let refId = $("#detail-referenceid")
      .find("div:last")
      .prop("innerText")
      .trim();
    resultItem.data("lbp-refId", refId);
  }

  if ($("#detail-commodity").find(".no-value").length == 0) {
    let commodity = $("#detail-commodity")
      .find("div:last")
      .prop("innerText")
      .trim();
    resultItem.data("lbp-commodity", commodity);
  }

  if ($("#detail-comments").find(".no-value").length == 0) {
    let comments = $("#detail-comments")
      .find("div:last")
      .prop("innerText")
      .trim();
    resultItem.data("lbp-comments", comments);
  }

  if ($("#detail-length").find(".no-value").length == 0) {
    let length = $("#detail-length").find("div:last").prop("innerText").trim();
    resultItem.data("lbp-length", length);
  }

  if ($("#detail-weight").find(".no-value").length == 0) {
    let weight = $("#detail-weight").find("div:last").prop("innerText").trim();
    resultItem.data("lbp-weight", weight);
  }

  // if($("#detail-contact").find(".no-value").length == 0) {
  //     let contact = $("#detail-contact").prop('innerText').trim();
  //     resultItem.data('lbp-contact', contact);
  // }

  // if($("#detail-company").find(".no-value").length == 0) {
  //     let company = $("#detail-company").prop('innerText').trim();
  //     resultItem.data('lbp-company', company);
  // }

  // if($("#detail-office").find(".no-value").length == 0) {
  //     let office = $("#detail-office").prop('innerText').trim();
  //     resultItem.data('lbp-company', resultItem.data('lbp-company') + ' ' + office);
  // }

  resultItem.data("lbp-has-detail", true);
}
function pushSharingIcon(id) {
  const resultItem = $(`#search-card-row-${id}`);
  const originSearch = $("#searchform-city-origin").val() || "";
  const origin = resultItem.data("lbp-origin") || "";
  const destination = resultItem.data("lbp-destination") || "";
  const _os = originSearch.replace(/ /gim, "+");
  const _ot = origin.replace(/ /gim, "+");
  const _d = destination.replace(/ /gim, "+");
  const mapLink =
    _os && _os === _ot
      ? `https://www.google.com/maps/dir/${_ot}/${_d}/`
      : `https://www.google.com/maps/dir/${_os}/${_ot}/${_d}/`;

  // const mapLink = encodeURI(
  //   `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
  // );
  if ($(".sharing-holder").length > 0) {
    $(`.sharing-holder`).remove();
  }
  $(".LBP_CalcContainer")
    .append(
      `<div class="sharing-holder">
    <a href="${mapLink}" target="_blank" class="LBP_linkMap">
                    <img style="width: 20px;height: 20px;" src="${chrome.runtime.getURL(
                      "img/map.png"
                    )}">
                </a>
    <div style="cursor:pointer;" id="lbp-share-${id}" title="Copy load">
          <img src="${shareIcon}" style='width: 20px;height: 20px;pointer-events: none;'></div></div>`
    )
    .ready(function () {
      $(`#lbp-share-${id}`).on("click", shareLoad.bind(resultItem));
      $(".LBP_CalcContainer .LBP_linkMap").attr("href", mapLink);
      resultItem.data("lbp-map-link", mapLink);
    });
}

function pushCalculator(id) {
  const row = $(`#search-card-row-${id}`);
  let dho = row.data("lbp-dho");
  let miles = row.data("lbp-miles");
  let rate = row.data("lbp-rate");
  let rpm = +miles !== 0 ? (+rate / +miles).toFixed(2) : "";

  let rpmPlus = row.data("lbp-rpmPlus");
  console.log(row.data(), "Data");
  if ($(".lbp-calc-section").length === 0) {
    $(".results-detail-header")
      .after(
        `
    <div class="lbp-calc-section">
      <div class='LBP_CalcContainer' data-row-id="${id}" data-dho="${dho}" data-trip="${miles}">
          <!-- First Line -->
            <div class='LBP_row'>
             
            </div>
          <!-- First Line End -->
          <!-- Second Line -->
            <div class='LBP_row'>
             <span class='LBP_col'>
                <span class="lbp_labelSpan">Rate</span>
                <span class='flex-1 lbp_inputUnit' data-char=''>
                <input
                  type='number'
                 id="lbp-calc-rate"
                  value="${rate === "" ? "" : truncateToDecimals(rate)}" 
                  min='1'
                  data-id='${id}'
                  data-char='$'
                  class='lbp_calc_input'
                  data-calc="RATE"
                />
                </span>
              </span>
              <span class='LBP_col' >
                <span class="lbp_labelSpan">All miles</span>
                <span class='flex-1 lbp_inputUnit static' data-char='' title="Miles including deadhead ">
                  <input
                    type='number'
                    id="lbp-calc-trip"
                    value="${miles === "" ? "" : miles + dho}"
                    min='0'
                    data-char='Mi'
                    class='lbp_calc_input'
                  />
                </span>
              </span>
              <span class='LBP_col' >
                <span class="lbp_labelSpan">RPM</span>
                <span class='flex-1 lbp_inputUnit' data-char='$'>
                  <input
                    type='number'
                    id="lbp-calc-rpm"
                    value="${truncateToDecimals(rpm)}"
                    step='0.01'
                    min='0.01'
                    data-char='$'
                    class='lbp_calc_input'
                    data-calc="RPM"
                  />
                </span>
              </span>
              <span class='LBP_col'>
                <span class="lbp_labelSpan">RPM+</span>
                <span class='flex-1 lbp_inputUnit' data-char='$' title=" RPM including deadhead ">
                  <input
                    type='number'
                    step='0.01'
                    min='0.01'
                    id="lbp-calc-rpmPlus"
                    value="${truncateToDecimals(rpmPlus)}"
                    data-char='Mi'
                    class='flex-1 lbp_calc_input'
                    data-calc="RPMPlus"
                  />
                </span>
              </span>
            </div>
          
          </div>
        </div>
    </div>
    </div>
    `
      )
      .ready(function () {
        $("#lbp-calc-rate,#lbp-calc-rpm,#lbp-calc-rpmPlus").on(
          "change keyup",
          rowCalculate
        );
        pushSharingIcon(id);
      });
  } else {
    $("#lbp-calc-rate").val(`${Math.floor(rate)}`);
    $("#lbp-calc-trip").val(`${+dho + +miles || "-"}`);
    $("#lbp-calc-rpm").val(`${rpm || ""}`);
    $("#lbp-calc-rpmPlus").val(rpmPlus || "");
    $(".LBP_CalcContainer").attr("data-row-id", id);
    $(".LBP_CalcContainer").attr("data-dho", dho);
    $(".LBP_CalcContainer").attr("data-trip", miles);
    pushSharingIcon(id);
  }
}

function rowCalculate() {
  const calculType = $(this).attr("data-calc");
  const rpm = $("#lbp-calc-rpm").val();
  const rpmPlus = $("#lbp-calc-rpmPlus").val();
  const allMiles = $("#lbp-calc-trip").val();
  const rate = $("#lbp-calc-rate").val();
  const trip = $(".LBP_CalcContainer").attr("data-trip");
  if (!trip) {
    $("#lbp-calc-rate").val("");
    $("#lbp-calc-rpmPlus").val("");
    $("#lbp-calc-rpm").val("");
    return;
  }
  switch (calculType) {
    case "RPM": {
      const nextRate = +rpm * trip;
      const nextRPMPlus = nextRate / allMiles;
      $("#lbp-calc-rate").val(Math.floor(nextRate));
      $("#lbp-calc-rpmPlus").val(nextRPMPlus.toFixed(2));
      break;
    }
    case "RATE": {
      const nextRPM = rate / trip;
      const nextRPMPlus = rate / allMiles;
      $("#lbp-calc-rpm").val(nextRPM.toFixed(2));
      $("#lbp-calc-rpmPlus").val(nextRPMPlus.toFixed(2));
      break;
    }
    case "RPMPlus": {
      const nextRate = +rpmPlus * allMiles;
      const nextRPM = nextRate / trip;
      $("#lbp-calc-rate").val(Math.floor(nextRate));
      $("#lbp-calc-rpm").val(nextRPM.toFixed(2));
      break;
    }
  }
}
function oppositeLiveCalculate() {
  let rate = 0;
  let rpm = +$("#lbp-calc-result").val();
  const trip = +$(`#lbp-calc-trip`).val();
  const dho = $(`#lbp-dho-enabled`).is(":checked")
    ? +$(`#lbp-calc-dho`).val()
    : 0;
  if (!trip) return;
  rate = rpm * (trip + dho);
  $(`#lbp-calc-rate`).val(rate);
}
function liveCalculate(event) {
  let rpm = 0;

  if ($(`#lbp-dho-enabled`).prop("checked")) {
    $(`#lbp-calc-dho`).prop("disabled", false);

    let dho = parseInt($(`#lbp-calc-dho`).val());

    if (dho && dho > 0) {
      rpm += dho;
    }
  } else {
    $(`#lbp-calc-dho`).prop("disabled", true);
  }

  let miles = parseInt($(`#lbp-calc-trip`).val());
  if (!miles) return console.log("no Miles");
  if (miles) {
    rpm += miles;
  }
  let rate = parseFloat($(`#lbp-calc-rate`).val());

  let finalVal = truncateToDecimals(rate / rpm);

  if (isFinite(finalVal) && rate) {
    rpm = "" + finalVal + "";
  } else {
    rpm = "";
  }

  $(".lbp__totalMiles").text(
    parseInt($(`#lbp-calc-dho`).val()) + parseInt($(`#lbp-calc-trip`).val())
  );
  $(`#lbp-calc-result`).val(rpm);
}

function addDestinationLink(resultItem) {
  const destination = resultItem.data("lbp-destination");
  const link = encodeURI(
    `https://truckersedge.dat.com/search-loads?origin=${destination}`
  );

  $(resultItem)
    .find(".destination-locale")
    .wrapInner(`<a href="${link}" target="_blank"></a>`);
}
function StartverifyStorage(cb, request, sender, sendResponse) {
  chrome.storage.local.get("user", ({ user }) => {
    if (!user) return;
    if (user.isCancelled) return;
    if (!user.keyToken) return;
    let valid = false;
    if (user.clientID && user.email) {
      if (user.isPaid) {
        if (new Date(user.subscriptionTill) > new Date()) {
          valid = true;
        }
      } else {
        let validDate = new Date(user.signup);
        validDate = validDate.addDays(7);
        if (new Date() < validDate) {
          valid = true;
        }
      }
      if (valid) cb(request, sender, sendResponse);
    }
  });
}

function MainInitCallBack(request, sender, sendResponse) {}

StartverifyStorage(() => {
  addMenuToggler();
});

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  const request = req;
  console.log("onRunTime : ", request);
  chrome.storage.local.get("user", ({ user }) => {
    if (!user) return appendTrialOverMessage();
    if (!user.keyToken) return appendTrialOverMessage();
    let valid = false;
    if (user.clientID && user.email) {
      if (user.isPaid) {
        if (new Date(user.subscriptionTill) > new Date()) {
          valid = true;
        }
      } else {
        let validDate = new Date(user.signup);
        validDate = validDate.addDays(7);
        if (new Date() < validDate) {
          valid = true;
        }
      }
      if (valid) {
        if (request.status === "searchLoadsPage") {
          console.log("searchLoadsPage");
          attachObserver();
          addMenuToggler();
          $(window).resize(addMenuToggler);
        } else if (request.status === "otherPage") {
          console.log("otherPage");
          if (observer !== undefined) {
            observer.disconnect();
            observer = undefined;
            console.log("observer disconnected");
          }
        } else if (request.status === "searchRequestSent") {
          console.log("searchRequestSent");
          updateColumnHeaders();
          appendFilters();
          reloadFilters();
        } else if (request.status === "detailsFetched") {
          const id = request.id;
          setTimeout(() => onshareCall(id), 500);
        }
      } else {
        appendTrialOverMessage();
      }
    }
  });
  //   return StartverifyStorage(MainInit, request, sender, sendResponse);
});
appendTrialOverMessage();
function appendTrialOverMessage() {
  chrome.storage.local.get("user", ({ user }) => {
    if (!document.querySelector("#search-tools")) {
      return setTimeout(appendTrialOverMessage, 500);
    }
    if (
      user &&
      !user.isCancelled &&
      (user.isPaid || new Date(user.signup).addDays(7) > new Date())
    )
      return;

    if (document.querySelector(".lbp__messageContainer")) {
      return setTimeout(appendTrialOverMessage, 500);
    }
    const activateTrial = `<img src="${chrome.runtime.getURL(
      "/img/icon128.png"
    )}" />`;
    const basicHTML = ` <style scoped>
          .lbp__messageContainer{
            font-family: Roboto,"Helvetica Neue",sans-serif;
            padding: 10px;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 25px;
            background: #fff;
            border-bottom: 2px solid #ddd;
          }
          .lbp__messageContainer img {
            width :32px;
          }
          .lbp__messageContainer span {
                font-family: Roboto,"Helvetica Neue",sans-serif;
                font-size: 15px;
                color: #333;
                    font-weight: 500;
          }
          .lbp__messageContainer a {
            padding: 5px 15px;
            color: #fff;
            background: #0091ea;
            font-size: 15px;
            font-family: 'Roboto';
            box-shadow: 0 3px 1px -2px rgb(0 0 0 / 20%), 0 2px 2px 0 rgb(0 0 0 / 14%), 0 1px 5px 0 rgb(0 0 0 / 12%);
            border-radius: 4px;
            font-weight: 500;
            letter-spacing: .7px;
          }
          .lbp__loginbtn {
              color: #FFF!important;
              padding: 4px 5px;
              cursor: pointer;
              border: #ddd;
              text-decoration:none;
              transform:scale(1);
              transition: all .7s;
          }
           .lbp__loginbtn:hover {
             transform:scale(1.2);
           }
           span.LBP_ActionSpan {
             display: flex;
             align-items: center;
            gap: 8px;
            padding: 4px 10px;
            margin: 2px;
            background: #474ffe;
            color: #fff;
            cursor: pointer;
            border-radius: 7px;
            transition: all .5s;
          }
          span.LBP_ActionSpan:hover {
            padding: 4px 15px;
          }
        </style>`;
    const text = !user
      ? `Activate Trial`
      : user.isCancelled
      ? "Renew Subscription"
      : "Go Premium";
    const w = (t) =>
      !user
        ? `
    <span class="LBP_ActionSpan" data-page="signup.html"> 
         ${activateTrial} ${t}
    </span>
    `
        : `
    <a href="${chrome.runtime.getURL("/html/checkout.html")}" target="_blank" 
        style="
          display: flex;
          justify-content: center;
          align-items: center;
          background: #474ffe;
          gap: 10px;"> 
      ${activateTrial} ${t}
    </a>
    `;
    const html = `
      <div class="lbp__messageContainer" style="justify-content: center;">
          ${basicHTML}
          ${w(text)}
        </div>
    `;
    $("#search-tools")
      .after(html)
      .ready(function () {
        $(".LBP_ActionSpan").click(injectAppLogin);
      });
    setTimeout(appendTrialOverMessage, 500);
  });
}

function onshareCall(id) {
  if (
    document.querySelector(
      ".divider.results-detail-container-mobile.wait-container"
    )
  )
    return setTimeout(() => onshareCall(id), 500);
  let resultItem = $(`#search-card-row-${id}`);
  appendDetails(resultItem);
  pushCalculator(id);
  if (shareClicked) {
    shareClicked = false;
    chrome.runtime.sendMessage({
      message: "createShareWindow",
      data: getLoadData.call(resultItem),
    });
  }
}

async function getSVGIcon(filename) {
  const url = chrome.runtime.getURL(filename);
  const request = await fetch(url);
  return await request.text();
}

function success(msg) {
  toastr.success(msg, "Success", {
    positionClass: "toast-bottom-left",
    timeOut: 1000,
  });
}

function error(msg) {
  toastr.error(msg, "Error", {
    positionClass: "toast-bottom-left",
    timeOut: 1000,
  });
}

function getSearchOrigin() {
  let storageData = JSON.parse(localStorage.getItem("LoadSearchFormData"));
  return btoa(storageData.originCityOrAreas.locationText);
}

function injectAppLogin() {
  const _target = $(this).attr("data-page");
  const container = document.createElement("div");
  $(container).css("display", "none");
  $(container).addClass("LBP__frameContainer");
  const styles = document.createElement("style");
  styles.scoped = true;
  $(styles).html(Styling);
  $(container).html(HTMLPage(_target));
  container.append(styles);
  $(container)
    .find("span")
    .click(function () {
      $(container).fadeOut("slow", () => {
        $(container).remove();
      });
    });
  $("body")
    .append(container)
    .ready(function () {
      $(container).fadeIn("slow");
    });
}
const HTMLPage = (dtPage = "login.html") => `
<div>
   <span>&times;</span>
  <iframe src="${chrome.runtime.getURL("/dist2/" + dtPage)}" />
</div>
`;
const Styling = `
  .LBP__frameContainer {
    position: fixed;
    width: 100vw;
    height: 100vh;
    top: 0;
    z-index: 1500;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0,0,0,0.6);
  }
  .LBP__frameContainer>div {
    width: calc(330px * .75);
    height: calc(600px * .75);
    border-radius: 15px;
    overflow: hidden;
    position: relative;
    -webkit-box-shadow: 0px 0px 25px 4px rgba(0,0,0,0.75);
-moz-box-shadow: 0px 0px 25px 4px rgba(0,0,0,0.75);
box-shadow: 0px 0px 25px 4px rgba(0,0,0,0.75);
  }
  .LBP__frameContainer iframe {
    width:100%;
    height:100%;
    margin-top: -1px;
    margin-left: -1px;
  }
  .LBP__frameContainer span {
    position: absolute;
    right: 5px;
    font-size: 35px;
    top: -5px;
    color: #fff;
    z-index: 150;
    cursor: pointer;
    transition: all .5s; 
  }
  .LBP__frameContainer span:hover {
    font-size: 40px;
  }
`;
$(document).ready(function () {
  chrome.runtime.sendMessage({
    name: "REFRESH",
    query: "SET_WEBSITE_USAGE",
    website: document.location.hostname,
    username: $("#user-salutation").text()?.slice(3),
  });
});
