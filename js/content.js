$.fn.hasAttr = function (name) {
  return this.attr(name) !== undefined;
};
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
chrome.runtime.sendMessage({ message: "setZoomLevel" });
const shareIcon = chrome.runtime.getURL("img/copy.png");

let initInterval;
let data = {};
let shareClicked = false;
let notified = false;
let isAttached = false;

let filters = {
  maxMiles: "",
  minMiles: "",
  minRPM: "",
  minRate: "",
  dhoEnable: false,
};

// document.addEventListener("readystatechange", (event) => {
//   if (document.readyState == "complete") {
//     verifyStorage(MainInit);
//   }
// });
verifyStorage(MainInit);

function verifyStorage(cb) {
 let unlimitedVersion = true;
  if(unlimitedVersion){
    console.log('unlimited version');
    cb();
    return
  }
  chrome.storage.local.get("user", ({ user }) => {
    if (!user) return appendTrialOverMessage();
    if (user.isCancelled) return appendTrialOverMessage();
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
        cb();
      } else {
        appendTrialOverMessage();
      }
    }
  });
}
function appendTrialOverMessage() {
  chrome.storage.local.get("user", ({ user }) => {
    if (!document.querySelector("#main")) {
      return setTimeout(appendTrialOverMessage, 500);
    }
    if (
      user &&
      !user.isCancelled &&
      (user.isPaid || new Date(user.signup).addDays(7) > new Date())
    )
      return;

    if (document.querySelector(".lbp__messageContainer")) {
      return;
    }
    const basicHTML = `  <style scoped>
        .LBP_Logoholder {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
      }
        .filtersSection {
          display: flex;
          padding: 0px;
          margin: 3px 0;
          background: #fff;
          border-radius: 9px;
          border: 0.5px solid #c4c4c4;
        }
          .lbp__messageContainer{
            font-family: Roboto,"Helvetica Neue",sans-serif;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 25px;
            background: #fff;
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
    const activateTrial = `<img src="${chrome.runtime.getURL(
      "/img/icon128.png"
    )}" />`;
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
          margin:5px;
          background: #474ffe;
          gap: 10px;"> 
      ${activateTrial} ${t}
    </a>
    `;
    const html = `
    <section class="filtersSection">
      <div class="lbp__messageContainer" style="justify-content: center;width: 100%;">
      <span class="LBP_Logoholder">
        ${w(text)}
        </span>
        ${basicHTML}
        </div>
        </section>
    `;
    $("#main")
      .prepend(html)
      .ready(function () {
        $(".LBP_ActionSpan").click(injectAppLogin);
      });
  });
}

function MainInit() {
  if (!document.body) return setTimeout(MainInit, 10);
  const searchTable = document.querySelector(
    ".searchListTable,.postings-table"
  );
  if (!searchTable || !document.querySelector(".searchResultsTable"))
    return setTimeout(MainInit, 10);
  chrome.runtime.sendMessage({
    name: "REFRESH",
    query: "INJECT_CSS",
  });
  if (document.location.pathname === "/postings/trucks") {
    $("html").attr("post-truck", "true");
  }
  const searchObs = new MutationObserver(searchWatcher);
  searchObs.observe(searchTable, {
    attributes: true,
    attributeFilter: ["class"],
    childList: true,
    subtree: true,
    attributeOldValue: true,
  });

  const searchId = $("tbody.currentSearch").attr("id");

  chrome.storage.local.get(searchId, function (data) {
    if (data[searchId]) filters = data[searchId];

    appendTableHeaders();
    appendFilters();

    const targetNode = document.querySelector(".searchResultsTable");
    const config = { attributes: false, childList: true };

    const observer = new MutationObserver(mainWatcher);
    observer.observe(targetNode, config);

    $(".searchResultsTable").data("attached", true);
  });
}
function searchWatcher(mutationsList, observer) {
  for (const mutation of mutationsList) {
    if (
      mutation.type == "attributes" &&
      mutation.target.classList.contains("currentSearch")
    ) {
      resetFilterValues();

      const searchId = $(mutation.target).attr("id");

      chrome.storage.local.get(searchId, (data) => {
        if (data[searchId]) {
          filters = data[searchId];

          $("#lbs-max-miles").val(filters.maxMiles);
          $("#lbs-min-miles").val(filters.minMiles);
          $("#lbs-min-rpm").val(filters.minRPM);
          $("#lbs-min-rate").val(filters.minRate);
        }
      });
    }
  }
}

function mainWatcher(mutationsList, observer) {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
      for (const resultItem of mutation.addedNodes) {
        if (
          resultItem.nodeName === "TBODY" &&
          resultItem.classList.contains("resultItem")
        ) {
          processResultItem(resultItem);

          const config = { attributes: true, childList: true };

          const observer = new MutationObserver(childWatcher);
          observer.observe(resultItem, config);
        }
      }
    }
  }
}

function childWatcher(mutationsList, observer) {
  for (const mutation of mutationsList) {
    // if(mutation.removedNodes.length && mutation.target.nodeName == 'TBODY') {
    // mutation.target.style.backgroundColor = '#FFF3CD';
    // processResultItem(mutation.target);
    // console.log('removed', mutation.removedNodes);
    // }

    if (
      mutation.addedNodes.length &&
      mutation.target.nodeName == "TBODY" &&
      mutation.addedNodes[0].classList.contains("resultDetails")
    ) {
      // mutation.target.style.backgroundColor = '#D4EDDA';
      processResultItem(mutation.target);
      // console.log('added', mutation.addedNodes);
    }
    // console.log(mutation.type, mutation.addedNodes.length, );
  }
}

function appendTableHeaders() {
  const shareButtonMarkup = `<th class="ext-share">
									<a class="sortField">
										<ng-transclude>
											<span class="ng-scope">Share</span>
										</ng-transclude>
										<i class="sort"></i>
									</a>
								</th>`;

  const columnHeaders = $(".searchResultsTable").find(".columnHeaders");
  $(".searchResultsTable")
    .find(".invisible")
    .find(".bookItNow")
    .before('<th class="liverate-head ng-scope">RPM</th>');
  columnHeaders.find(".rate").after(`<th class="liverate" title="Click to ${
    filters.dhoEnable ? "Exclude" : "Include"
  } Deadhead Origin in RPM Calculation">
											<a class="sortField">
												<ng-transclude>
													<span class="ng-scope">${filters.dhoEnable ? "RPM+" : "RPM"}</span>
												</ng-transclude>
												<i class="sort"></i>
											</a>
										</th>`);
  // columnHeaders.find(".origin").after('<th class="tripmap"></th>');
  // columnHeaders.find(".bookItNow").after(shareButtonMarkup);
  $("th.liverate").click(togglDHO);
  $('td.similar').after('<td class="similar"></td>');
}

function togglDHO() {
  if (filters.dhoEnable) {
    filters.dhoEnable = false;
    $("th.liverate span").text("RPM");
    $("th.liverate").attr(
      "title",
      "Click to Include Deadhead Origin from RPM Calculation"
    );
  } else {
    filters.dhoEnable = true;
    $("th.liverate span").text("RPM+");
    $("th.liverate").attr(
      "title",
      "Click to Exclude Deadhead Origin in RPM Calculation"
    );
  }

  const data = {};
  data[$("tbody.currentSearch").attr("id")] = filters;

  chrome.storage.local.set(data, () => {
    iterateItems(addRPM);
    iterateItems(filterRecord);

    // $("#lbs-filters-status").text("RPM recalculated successfully");
    // setTimeout(() => $("#lbs-filters-status").text(""), 4000);
    success("RPM recalculated successfully");
  });
}
var multiSelect;
function appendFilters() {
  $(".utils")
    .prepend(
      `
      <li style="position:relative;margin-right: 10px;">
  <img src="${chrome.runtime.getURL(
    "/img/icon128.png"
  )}" data-page="user-account.html" class="lbp__loginbtnIcon"/> 
  &nbsp; 
  </li>
  `
    )
    .ready(function () {
      $(".lbp__loginbtnIcon").click(injectAppLogin);
    });
  $("#main").prepend(
    '<section class="filtersSection"><div id="lbs-filters"></div></section>'
  );

  $("#lbs-filters").append(
    `<input id="lbs-max-miles" type="number" min="1" placeholder="Maximum Miles" value="${
      filters.maxMiles ?? ""
    }">`
  );
  $("#lbs-filters").append(
    `<input id="lbs-min-miles" type="number" min="1" placeholder="Minimum Miles" value="${
      filters.minMiles ?? ""
    }">`
  );
  $("#lbs-filters").append(
    `<input id="lbs-min-rate" type="number" min="1" placeholder="Minimum Rate" value="${
      filters.minRate ?? ""
    }">`
  );
  $("#lbs-filters").append(
    `<input id="lbs-min-rpm" type="number" step="0.01" min="0.01" placeholder="Minimum RPM" value="${
      filters.minRPM ?? ""
    }">`
  );
  $("#lbs-filters")
    .append(`<select id="LBP__IgnoreStates"></select>`)
    .ready(function () {
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
    });
  $("#lbs-filters").append(
    `<button id="lbs-apply-filters" type="button">Apply Filters</button>`
  );
  $("#lbs-filters").append(
    `<button id="lbs-reset-filters" type="button">Reset Filters</button>`
  );
  $("#lbs-filters").append(`<strong id="lbs-filters-status"></strong>`);
  $("#lbs-filters").append(`
    <input id="ext__useGoogleMaps" type="checkbox" checked/>
    <label for="ext__useGoogleMaps" class="ext__useGoogleMap"></label>
    <span class="ext__googleMapSpan">Google Maps</span>
  `);
  $("#lbs-max-miles,#lbs-min-miles,#lbs-min-rate,#lbs-min-rpm").on(
    "keyup",
    function (e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        applyFilters();
      }
    }
  );
  $("#lbs-apply-filters").click(applyFilters);
  $("#lbs-reset-filters").click(resetFilters);
}

function applyFilters() {
  filters.maxMiles = $("#lbs-max-miles").val();
  filters.minMiles = $("#lbs-min-miles").val();
  filters.minRPM = $("#lbs-min-rpm").val();
  filters.minRate = $("#lbs-min-rate").val();
  filters.ignoreStates = multiSelect.selectedOptions;
  const data = {};
  data[$("tbody.currentSearch").attr("id")] = filters;

  chrome.storage.local.set(data, () => {
    iterateItems(filterRecord);

    // $("#lbs-filters-status").text("Filter applied successfully");
    // setTimeout(() => $("#lbs-filters-status").text(""), 4000);
    success("filter applied successfully");
  });
}

function resetFilterValues() {
  $("#lbs-max-miles").val("");
  $("#lbs-min-miles").val("");
  $("#lbs-min-rpm").val("");
  $("#lbs-min-rate").val("");

  filters.maxMiles = "";
  filters.minMiles = "";
  filters.minRPM = "";
  filters.minRate = "";
}

function resetFilters() {
  resetFilterValues();

  const data = {};
  data[$("tbody.currentSearch").attr("id")] = filters;

  chrome.storage.local.set(data, () => {
    iterateItems(filterRecord);

    // $("#lbs-filters-status").text("Filter cleared");
    // setTimeout(() => $("#lbs-filters-status").text(""), 4000);
    success("Filter cleared");
  });
}

async function processResultItem(resultItem) {
  let resultItemId = $(resultItem).find('tr').attr('id')

  addMapLink(resultItem);
  // addShareIcon(resultItem);

  addRPM(resultItem);

  filterRecord(resultItem);
  pushCalculator(resultItemId);

  // sendNotificationRequest(resultItem);

  destSearch(resultItem);

  $(resultItem).find("tr").data("checked", true);
}

function addMapLink(resultItem) {
  if ($(resultItem).find("tr").find(".trip.tripmap").length === 0) {
    const originSearch =
      $(".currentSearch .origin").text() ||
      $(".postings-table .postItem.active .origin").text() ||
      "";
    const originText = $(resultItem).find("tr").find(".origin").text() || "";
    const destText = $(resultItem).find("tr").find(".dest").text() || "";
    const _os = originSearch.replace(/ /gim, "+");
    const _ot = originText.replace(/ /gim, "+");
    const _dt = destText.replace(/ /gim, "+");
    const mapLink =
      _os === _ot || !_os
        ? `https://www.google.com/maps/dir/${_ot}/${_dt}`
        : `https://www.google.com/maps/dir/${_os}/${_ot}/${_dt}`;
    $(resultItem).find("tr").find(".trip").addClass("tripmap");
    $(resultItem)
      .find("tr")
      .find(".trip")
      .find("a")
      .attr("data-href", mapLink)
      .click(function (e) {
        const isMap = $("#ext__useGoogleMaps").is(":checked");
        if (!isMap) return;
        e.preventDefault();
        const aTag = document.createElement("a");
        aTag.href = mapLink;
        aTag.target = "_blank";
        aTag.click();
      });
    $(resultItem).data();
    // $(resultItem).find("tr").find(".origin").after(`<td class="tripmap">
    // 			<a href="${mapLink}" target="_blank">
    // 				<img style="width: 20px;height: 20px;" src="${chrome.runtime.getURL(
    //           "img/map.png"
    //         )}">
    // 			</a>
    // 		</td>`);
  }
}

function addShareIcon(resultItem) {
  const id = $(resultItem).find("tr").attr("id");

  if ($(resultItem).find("tr").find(`.ext-share-${id}`).length == 0) {
    $(`#${id} ~ tr.actions td`).after(
      `<td class='ext-share-${id}><a href='#' title="Copy load"><img style='width: 20px;height: 20px;cursor: pointer;' src='${shareIcon}'></a></td>`
    );

    $(`.ext-share-${id}`).click((event) => {
      let resultDetails = $(resultItem).find("tr.resultDetails");

      if (resultDetails.length) {
        event.stopPropagation();
        $(`#${id}`).data("share", false);

        let resultSummaryID = $(resultItem).find(".resultSummary").attr("id");
        // chrome.runtime.sendMessage({
        //   message: "createShareWindow",
        //   data: getLoadData(resultSummaryID),
        // });
        console.log(getLoadData(resultSummaryID));
      } else {
        $(`#${id}`).data("share", true);
      }
    });
  }
}

function addRPM(resultItem) {
  const rpmResult = calculateRPM(resultItem);
  if ($(resultItem).find("tr .liverate").length > 0) {
    $(resultItem).find("tr").find(".liverate").text(rpmResult);
  } else {
    $(resultItem)
      .find("tr")
      .find(".rate")
      .after(`<td class='liverate'>${rpmResult}</td>`);
  }
}

function getRate(resultItem) {
  return new Promise((resolve, reject) => {
    let rate = $(resultItem).find("tr").find("td.rate");
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
    const trackLink = $(resultItem)
      .find("tr")
      .find('a[track-link-category="Trip Miles"]');

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

function sendNotificationRequest(resultItem) {
  const trackLink = $(resultItem)
    .find("tr")
    .find('a[track-link-category="Trip Miles"]');
  const rate = $(resultItem).find("tr").find("td.rate");
  const liverate = $(resultItem).find("tr").find(".liverate");

  if (
    trackLink.hasAttr("style") ||
    rate.hasAttr("style") ||
    liverate.hasAttr("style")
  ) {
    if (data.notifyOnce && !notified) {
      notified = true;

      if (data.soundEnable) {
        chrome.runtime.sendMessage({ message: "playNotification" });
      }

      if (data.popupAlertEnable) {
        const id = $(resultItem).find("tr").attr("id");
        chrome.runtime.sendMessage({
          message: "createPopupWindow",
          data: getLoadData(id),
        });
      }
    } else if (data.notifyAll) {
      if (data.soundEnable) {
        chrome.runtime.sendMessage({ message: "playNotification" });
      }

      // if(data.popupAlertEnable) {
      // 	const id = $(resultItem).find('tr').attr('id');
      // 	chrome.runtime.sendMessage({message: "createPopupWindow", data: getLoadData(id)});
      // }
    }
  }
}

function destSearch(resultItem) {
  let dest = $(resultItem)
    .find("tr")
    .find("td.dest")
    .wrapInner('<a href="#"></a>');

  dest.find("a").click(function () {
    $("button.newSearch").click();

    let hideInverval = setInterval(() => {
      if ($("#select2-drop")) {
        $("#select2-drop").hide();

        $("tbody.isNew")
          .find("td.origin input")
          .focus()
          .val($(this).text())
          .blur();
        $(".qa-search-button").click();

        clearInterval(hideInverval);
      }
    }, 100);
  });
}

function calculateRPM(resultItem) {
  let rpm = 0;

  let dho = parseInt(
    Number(
      $(resultItem)
        .find("tr")
        .find(".do")
        .text()
        .replace(/[^0-9.-]+/g, "")
    )
  );

  if (dho && filters.dhoEnable) {
    rpm += dho;
  }

  let miles = parseInt(
    Number(
      $(resultItem)
        .find("tr")
        .find(".trip a")
        .text()
        .replace(/[^0-9.-]+/g, "")
    )
  );
  if (!miles) return "-";
  if (miles) {
    rpm += miles;
  }

  let rate = parseFloat(
    Number(
      $(resultItem)
        .find("tr")
        .find(".rate")
        .text()
        .replace(/[^0-9.-]+/g, "")
    )
  );
  let finalVal = truncateToDecimals(rate / rpm);

  if (isFinite(finalVal) && rate) {
    rpm = "$" + finalVal + "/mi";
  } else {
    rpm = "-";
  }

  return rpm;
}

function getLoadData(id) {
  let details = $(`#${id}`).next("tr.resultDetails");
  let row = $(`#${id}`);

  const payload = {};

  let dho = sanitizeText(row.find("td.do").text());
  if (dho !== "") {
    payload["dho"] = dho;
  }

  let origin = sanitizeText(row.find("td.origin").text());
  if (origin !== "") {
    payload["origin"] = origin;
  }

  let destination = sanitizeText(row.find("td.dest").text());
  if (destination !== "") {
    payload["destination"] = destination;
  }

  let trip = sanitizeText(row.find("td.trip").text());

  if (trip !== "") {
    payload["trip"] = trip;
  }

  let length = sanitizeText(row.find("td.length").text());
  if (length !== "") {
    payload["length"] = length;
  }

  let weight = sanitizeText(row.find("td.weight").text());
  if (weight !== "") {
    payload["weight"] = weight;
  }

  let rate = sanitizeText(row.find("td.rate").text());
  if (rate !== "") {
    payload["rate"] = rate;
  }

  let rpm = sanitizeText(row.find("td.liverate").text());
  if (rpm !== "") {
    payload["rpm"] = rpm;
  }

  let contact = sanitizeText(row.find("td.contact").text());
  if (contact !== "") {
    payload["contact"] = contact;
  }

  let company = sanitizeText(row.find("td.company>a.companyToggle").text());
  if (company !== "") {
    payload["company"] = company;
  }

  let refId = sanitizeText(details.find(".refId").text());
  if (refId !== "") {
    payload["refId"] = refId;
  }

  let commodity = sanitizeText(details.find(".commodity").text());
  if (commodity !== "") {
    payload["commodity"] = commodity;
  }

  let comments1 = sanitizeText(details.find(".comments1").text());
  if (comments1 !== "") {
    payload["comments1"] = comments1;
  }

  let comments2 = sanitizeText(details.find(".comments2").text());
  if (comments2 !== "") {
    payload["comments2"] = comments2;
  }

  if (dho !== "" && trip !== "") {
    let value_dho = parseInt(Number(dho.replace(/[^0-9.]+/g, "")));
    let value_trip = parseInt(Number(trip.replace(/[^0-9.]+/g, "")));
    payload["total_miles"] = `${value_dho + value_trip}`;
  }
  if (dho !== "" && trip !== "" && rate !== "") {
    let value_dho = parseInt(Number(dho.replace(/[^0-9.]+/g, "")));
    let value_trip = parseInt(Number(trip.replace(/[^0-9.]+/g, "")));
    let rate_value = parseFloat(rate.replace(/(\$|,)/gim, ""));
    payload["rpmPlus"] = `\$${(rate_value / (value_dho + value_trip)).toFixed(
      2
    )}/mi`;
    payload["rpmRegular"] = `\$${(rate_value / value_trip).toFixed(2)}/mi`;
  }
  let tripmap = row.find("td.trip").find("a").attr("data-href");
  if (tripmap !== "") {
    payload["map-link"] = tripmap;
  }

  return payload;
}

function sanitizeText(text) {
  return text.replace(/[—-]/g, "").trim();
}

function truncateToDecimals(num, dec = 2) {
  const calcDec = Math.pow(10, dec);
  return (Math.trunc(num * calcDec) / calcDec).toFixed(2);
}

function iterateItems(callback, attrSelector = null) {
  if (attrSelector) {
    const attribute = Object.key(0);
    $(".searchResultsTable")
      .find(`.resultItem[${attribute}=${attrSelector[attribute]}]`)
      .each((index, element) => callback(element));
  } else {
    $(".searchResultsTable")
      .find(".resultItem")
      .each((index, element) => callback(element));
  }
}

function addShareIconHtml(id) {
  if ($(`.ext-share-${id}`).length <= 0) {
    $(`#${id} ~ tr.actions td`).prepend(
      `<a title="Copy load" class='ext-share-${id}' style="float:right;padding-top: 3px;padding-right: 15px;" href='#'><img style='width: 20px;height: 20px;' src='${shareIcon}'></a>`
    );
    $(`.ext-share-${id}`).click((event) => {
      event.stopPropagation();
      $(`#${id}`).data("share", false);
      let resultSummaryID = id;
      const _data = getLoadData(resultSummaryID);
      const _message = mail(_data);
      navigator.clipboard.writeText(_message);
      success("Load copied");
      // $(`.ext-share-${id}`).addClass("clicked");
      // setTimeout(() => {
      //   $(`.ext-share-${id}`).removeClass("clicked");
      // }, 1200);
      // chrome.runtime.sendMessage({
      //   message: "createShareWindow",
      //   data: getLoadData(resultSummaryID),
      // });
    });
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
function handleHistory(id, rate, trip) {
  if (
    $(`#${id}`)
      .next("tr.resultDetails")
      .find(".widget-numbers .widget-numbers-num").length <= 0
  ) {
    return setTimeout(() => handleHistory(id, rate, trip), 100);
  }
  if (
    $(`#${id}`).next("tr.resultDetails").find(".LBP_CalcContainer").length <= 0
  ) {
    return setTimeout(() => handleHistory(id, rate, trip), 100);
  }
  if (!rate) return;
  if (!trip) return;

  const item = $(`#${id}`)
    .next("tr.resultDetails")
    .find(".widget-numbers .widget-numbers-num");
  const calucltor = $(`#${id}`)
    .next("tr.resultDetails")
    .find(".LBP_CalcContainer");
  if ($(calucltor).hasClass("rateChangeHandled")) {
    return;
  }
  const oldRPM = $(item)
    .text()
    .replace(/(\$|,)/gi, "");
  let oldRate = 0;
  if (parseInt(oldRPM) === parseFloat(oldRPM)) {
    oldRate = parseInt(oldRPM);
  } else {
    oldRate = parseFloat(oldRPM) * trip;
  }
  if (!oldRate) return;
  const diff = Math.abs(rate - oldRate);
  if (!diff || diff === 0) {
    return $(calucltor).addClass("rateChangeHandled");
  }
  if (rate < oldRate) {
    const inc = truncateToDecimals((diff / oldRate) * 100);
    // $(item).addClass("lbp-handled DOWN").attr("style", `--rpm:"${inc}%"`);
    $(calucltor).addClass("rateChangeHandled")
      .append(`<div class="rateChange">Rate is $${truncateToDecimals(diff)} 
    <span class="LBP_RATE_CHANGE DOWN">${inc}%</span>&nbsp;below avg</div>`);
  } else {
    const inc = truncateToDecimals((diff / oldRate) * 100);
    // $(item).addClass("lbp-handled UP").attr("style", `--rpm:"${inc}%"`);
    $(calucltor).addClass("rateChangeHandled")
      .append(`<div class="rateChange">Rate is $${truncateToDecimals(diff)} 
    <span class="LBP_RATE_CHANGE UP">${inc}%</span>&nbsp;above avg</div>`);
  }
}

function pushCalculator(id) {
  let details = $(`#${id}`).next("tr.resultDetails");
  console.log(details);
  const t = $(details).find(".widget-numbers .widget-numbers-num").text();
  console.log(t, $(details).find(".widget-numbers .widget-numbers-num"));
  addShareIconHtml(id);
  if (details.find("div.LBP_CalcContainer").length === 0) {
    let dho = parseInt(
      Number(
        $(`#${id}`)
          .find(".do")
          .text()
          .replace(/[^0-9.-]+/g, "")
      )
    );
    let miles = parseInt(
      Number(
        $(`#${id}`)
          .find(".trip a")
          .text()
          .replace(/[^0-9.-]+/g, "")
      )
    );
    let rate = parseFloat(
      Number(
        $(`#${id}`)
          .find(".rate")
          .text()
          .replace(/[^0-9.-]+/g, "")
      )
    );
    const rpmPlus = truncateToDecimals(rate / (miles + dho));
    const rpm = truncateToDecimals(rate / miles);
    handleHistory(id, rate, miles);
    details
      .find("td")
      .attr("colspan", 16)
      .after(
        `<td colspan='4' style="padding:0px;box-sizing: border-box;">
          <div class='LBP_CalcContainer' id="calcContainer-${id}" data-dho="${dho}" data-trip="${miles}">
          <!-- First Line -->
            <div class='LBP_row'>
              <span class='LBP_col' style="margin:0 auto;">
                <span class="lbp_labelSpan">Rate</span>
                <span class='flex-1 lbp_inputUnit' data-char=''>
                <input
                  type='number'
                  id='lbs-rate-${id}'
                  value='${rate}'
                  min='1'
                  data-id='${id}'
                  data-char='$'
                  class='lbp_calc_input'
                  data-calc="RATE"
                  style="width: 90px;"
                />
                </span>
              </span>
            </div>
          <!-- First Line End -->
          <!-- Second Line -->
            <div class='LBP_row'>
              <span class='LBP_col'>
                <span class="lbp_labelSpan">All miles</span>
                <span class='flex-1 lbp_inputUnit static' data-char='' title="Miles including deadhead ">
                  <input
                    type='number'
                    id='lbs-trip-${id}'
                    value='${miles + dho}'
                    min='0'
                    data-id='${id}'
                    data-char='Mi'
                    class='lbp_calc_input'
                    
                  />
                </span>
              </span>
              <span class='LBP_col'>
                <span class="lbp_labelSpan">RPM</span>
                <span class='flex-1 lbp_inputUnit' data-char='$'>
                  <input
                    type='number'
                    id='lbs-rpm-${id}'
                    value='${rpm}'
                    step='0.01'
                    min='0.01'
                    data-id='${id}'
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
                    id='lbs-calc-rpmPlus-${id}'
                    data-id='${id}'
                    data-char='Mi'
                    value="${rpmPlus}"
                    class='flex-1 lbp_calc_input'
                    data-calc="RPMPlus"
                  />
                </span>
              </span>
            </div>
          <!-- Second Line End -->
          </div>
        </div>
      </td>
      <td>&nbsp;</td>
      `
      )
      .ready(function () {
        $(`#lbs-rpm-${id}, #lbs-calc-rpmPlus-${id}, #lbs-rate-${id} `).on(
          "change keyup",
          rowCalculate
        );
      });
    details.next("tr.actions").find("td").attr("colspan", 21);
    // $(
    //   `#lbs-dho-${id}, #lbs-trip-${id}, #lbs-rate-${id}, #lbs-dho-enabled-${id}`
    // ).on("change keyup", liveCalculate);
    // $(`#lbs-calc-result-${id}`).on("change keyup", oppositeLiveCalculate);
    // $(`#lbs-dho-enabled-${id}`).trigger("change");
  }
}
function rowCalculate() {
  const calculType = $(this).attr("data-calc");
  const id = $(this).attr("data-id");
  const rpm = $(`#lbs-rpm-${id}`).val();
  const rpmPlus = $(`#lbs-calc-rpmPlus-${id}`).val();
  const allMiles = $(`#lbs-trip-${id}`).val();
  const rate = +$(`#lbs-rate-${id}`).val();
  const trip = $(`#calcContainer-${id}`).attr("data-trip");
  if (!trip) {
    $(`#lbs-rate-${id}`).val("");
    $(`#lbs-calc-rpmPlus-${id}`).val("");
    $(`#lbs-rpm-${id}`).val("");
    return;
  }
  switch (calculType) {
    case "RPM": {
      const nextRate = +rpm * trip;
      const nextRPMPlus = nextRate / allMiles;
      $(`#lbs-rate-${id}`).val(Math.floor(nextRate));
      $(`#lbs-calc-rpmPlus-${id}`).val(truncateToDecimals(nextRPMPlus));
      break;
    }
    case "RATE": {
      const nextRPM = rate / trip;
      const nextRPMPlus = rate / allMiles;
      $(`#lbs-rpm-${id}`).val(truncateToDecimals(nextRPM));
      $(`#lbs-calc-rpmPlus-${id}`).val(truncateToDecimals(nextRPMPlus));
      break;
    }
    case "RPMPlus": {
      const nextRate = +rpmPlus * allMiles;
      const nextRPM = nextRate / trip;
      $(`#lbs-rate-${id}`).val(Math.floor(nextRate));
      $(`#lbs-rpm-${id}`).val(truncateToDecimals(nextRPM));
      break;
    }
  }
}
function oppositeLiveCalculate() {
  const id = $(this).attr("data-id");
  let rate = 0;
  const dho = $(`#lbs-dho-enabled-${id}`).is(":checked")
    ? +$(`#lbs-dho-${id}`).val()
    : 0;
  const trip = +$(`#lbs-trip-${id}`).val();
  if (!trip) return;
  const rpm = +$(`#lbs-calc-result-${id}`).val();
  rate = truncateToDecimals(rpm * (trip + dho));
  $(`#lbs-rate-${id}`).val(rate);
}
function liveCalculate(event, _id) {
  const id = _id || $(this).data("id");
  let rpm = 0;

  if ($(`#lbs-dho-enabled-${id}`).prop("checked")) {
    $(`#lbs-dho-${id}`).prop("disabled", false);

    let dho = parseInt(Number($(`#lbs-dho-${id}`).val()));

    if (dho && dho > 0) {
      rpm += dho;
    }
  } else {
    $(`#lbs-dho-${id}`).prop("disabled", true);
  }

  let miles = parseInt(Number($(`#lbs-trip-${id}`).val()));

  if (miles) {
    rpm += miles;
  }

  let rate = parseFloat(Number($(`#lbs-rate-${id}`).val()));

  let finalVal = truncateToDecimals(rate / rpm);

  if (isFinite(finalVal) && rate) {
    rpm = "" + finalVal + "";
  } else {
    rpm = "";
  }
  $(`.lbp__totalMiles-${id}`).text(
    miles + parseInt(Number($(`#lbs-dho-${id}`).val()))
  );
  $(`#lbs-calc-result-${id}`).val(rpm);
}
function getStates(resultItem) {
  return new Promise((resolve) => {
    const state = $(resultItem).find("tr").find("td.dest").text() || "";
    const selectedStates = (multiSelect && multiSelect.selectedOptions) || [];
    if (selectedStates && selectedStates.length > 0) {
      const matchState = selectedStates.find(
        (s) => state.indexOf(s.value) !== -1 || state.indexOf(s.text) !== -1
      );
      return resolve(!!matchState);
    } else {
      return resolve(false);
    }
  });
}
async function filterRecord(resultItem) {
  let rpm = Number(
    $(resultItem)
      .find("tr")
      .find(".liverate")
      .text()
      .replace(/[^0-9\.]+/g, "")
  );

  let rpmSatisfy = rpm >= Number(filters.minRPM);

  const rate = await getRate(resultItem);
  const miles = await getMiles(resultItem);
  const igS = await getStates(resultItem);
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('details fetched');
  if (request.status === "detailsFetched") {
    const id = request.id;
    pushCalculator(id);

    if ($(`#${id}`).data("share")) {
      chrome.runtime.sendMessage({
        message: "createShareWindow",
        data: getLoadData(id),
      });
    }
  } else if (request.status === "searchDone") {
    $(".filter-panel-toggle").click();
  }
});
$(document).ready(function () {
  chrome.runtime.sendMessage({
    name: "REFRESH",
    query: "SET_WEBSITE_USAGE",
    website: document.location.hostname,
    username: $("#user-salutation").text()?.slice(3),
  });
});
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
    left: 0;
    display: flex;
    justify-content: center;
    z-index: 1500;
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
  }
  .LBP__frameContainer span {
    position: absolute;
    right: 5px;
    font-size: 35px;
    top: 5px;
    color: #fff;
    z-index: 150;
    cursor: pointer;
    transition: all .5s; 
  }
  .LBP__frameContainer span:hover {
    font-size: 40px;
  }
`;
