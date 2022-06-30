var baseUrl = "./";
var assetsUrl = baseUrl + "assets/";
var baseResourcesUrl = baseUrl + "resources/base/";
var brandResourcesUrl = null;
var api_analytics_base_url = "https://analytics.camonapp.com/v1/xrevent";
var api_lambda_getExperienceForMonorail_url =
  "https://analytics.camonapp.com/devel/viewermeta";
var default_brand = "camonapp";

var analyticsCommonData = {
  customerId: null,
  campaignId: null,
  experienceId: null,
};

var logManager = new (function () {
  this.pendingQueue = [];

  this.logExperienceTime = function (time) {
    this.logTiming("experience_time", time);
  };

  this.logExperienceLoadTime = function (time) {
    this.logTiming("experience_load_time", time);
  };

  this.logTiming = function (action, valueInMs) {
    if (valueInMs != null && valueInMs > 0) {
      this.logEvent("experience", action, null, valueInMs);
    }
  };

  this.logExperienceView = function () {
    this.logEvent("experience", "experience_view", null, null);
  };

  this.logEvent = function (category, name, label, value) {
    // Esto comprueba si hay no hay idExperiencia y guarda los eventos para procesarlos despues.
    if (analyticsCommonData.experienceId == null) {
      this.pendingQueue.push({
        category: category,
        name: name,
        label: label,
        value: value,
      });
    } else {
      this.flushPendingEvents();
      this.doLogEvent(category, name, label, value);
    }
  };

  this.doLogEvent = function (category, name, label, value) {
    if (envIsProd()) {
      this.coaEvent(category, name, label, value);
    } else {
      console.log("Preview Event", category, name, label, value);
    }
  };

  this.coaEventMakeData = function (category, action, label, valueInMS) {
    var params = {
      source: "web",
      eventCategory: category,
      eventAction: action,
      customerId: analyticsCommonData.customerId,
      campaignId: analyticsCommonData.campaignId,
      experienceId: analyticsCommonData.experienceId,
      draft: false,
      userUuid: getUserUID(),
    };

    if (label != null) params.eventLabel = label;

    if (valueInMS != null) params.eventValue = valueInMS;

    return params;
  };

  this.coaEvent = function (category, action, label, value) {
    navigator.sendBeacon(
      api_analytics_base_url,
      JSON.stringify(this.coaEventMakeData(category, action, label, value))
    );
  };

  /**
   * Esta funcion envia los eventos pendientes a loguearse
   */
  this.flushPendingEvents = function () {
    var self = this;
    this.pendingQueue.map(function (item) {
      self.doLogEvent(item.category, item.name, item.label, item.value);
    });
    this.pendingQueue = [];
  };
})();

var brand = null;
var onlyMobile = false;
var backurl;
var xr = {
  dest: "#model",
  ar: true,
  autoRotate: true,
  cameraControls: true,
  backgroundColor: "#fff",
};

var i18n = new (function () {
  this.preferredLang = null;
  this.baseTranslations = null;
  this.brandTranslations = null;

  this.init = function (callback) {
    var self = this;
    $.getJSON(baseResourcesUrl + "i18n/translations.json", function (data) {
      self.baseTranslations = data;

      $.getJSON(
        brandResourcesUrl + "i18n/translations.json" + "?d=" + Date.now(),
        function (data) {
          self.brandTranslations = data;
        }
      ).always(callback);
    });
  };

  this.t = function (key) {
    if (this.preferredLang == null) {
      this.preferredLang = this.getPreferredLang();
    }
    if (
      this.brandTranslations != null &&
      this.brandTranslations[this.preferredLang] != null &&
      this.brandTranslations[this.preferredLang][key] != null
    ) {
      return this.brandTranslations[this.preferredLang][key];
    } else {
      return this.baseTranslations[this.preferredLang][key];
    }
  };

  this.getDefaultLang = function () {
    return "en";
  };

  this.getPreferredLang = function () {
    var available = ["en", "es", "de", "pt", "it", "pl"];
    var lang = navigator.languages[0];
    lang =
      lang.indexOf("-") > 0
        ? lang.substring(0, 2).toLowerCase()
        : lang.toLowerCase();
    var langInTranslation = available.find((e) => e == lang);
    return langInTranslation !== undefined
      ? langInTranslation
      : this.getDefaultLang();
  };
})();

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

function getUserUID() {
  if (window.localStorage.getItem("coa_uid") == null) {
    window.localStorage.setItem("coa_uid", uuidv4());
  }
  return window.localStorage.getItem("coa_uid");
}

function envIsProd() {
  return !(
    window.location.hostname == "127.0.0.1" ||
    window.location.hostname.indexOf("192.168") == 0
  );
}

function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

function getWhitelabelBrandFromSubdomain() {
  // TODO: queda pendiente poder customizar brands via iframe (por el momento van a defaultear todos los iframes a camonapp)
  if (envIsProd()) {
    // var subdomain = window.location.hostname.substring(0, window.location.hostname.indexOf("."));
    var subdomain = window.location.hostname.substring(
      0,
      window.location.hostname.lastIndexOf(".camonapp")
    );
    switch (subdomain) {
      case "vr":
      case "vr-staging":
        return default_brand;
      case "abel":
      case "abelpintos":
        return "move-concerts-abel-pintos";
      case "buheronegro":
        return "buheronegro";
      case "o2":
        config.onlyMobile = true;
        config.backurl = "https://o2.camonapp.com/produkte";
        return "o2";
      case "globant":
        return "globant";
      case "www.shopdisney.castlecollection":
        return "disney-castle-collection";
      case "nestle":
        config.onlyMobile = true;
        config.backurl = "https://nestle.camonapp.com/nescafe";
        return "nescafe";
      case "pacorabanne":
        config.onlyMobile = true;
        return "pacorabanne";
      case "victorinox":
        config.onlyMobile = true;
        return "victorinox";
      case "liverpool":
        return "liverpool";
      case "fanta":
        config.onlyMobile = true;

        config.backurl = location.search.includes("-uy")
          ? "https://fanta.camonapp.com/halloween-uy"
          : "https://fanta.camonapp.com/halloween";
        return "fanta";
      case "fan":
        config.onlyMobile = true;

        config.backurl = location.search.includes("-uy")
          ? "https://fanta.camonapp.com/halloween-uy"
          : "https://fanta.camonapp.com/halloween";
        return "fanta";
      case "philipmorris":
        onlyMobile = true;
        backurl = "https://philipmorris.camonapp.com/original";
        return "philipmorris";
      case "limansky":
        onlyMobile = true;
        return "limansky";
      case "disney-frozen":
        onlyMobile = false;
        return "disney-frozen";
      case "renault":
        onlyMobile = true;
        return "renault";
      case "unicenter":
        return "unicenter";
      case "plazaoeste":
        return "plazaoeste";
      case "palmas":
        return "palmas";
      case "portalrosario":
        return "portalrosario";
      case "portaltucuman":
        return "portaltucuman";
      case "portalpatagonia":
        return "portalpatagonia";
      case "portallomas":
        return "portallomas";
      case "portaltrelew":
        return "portaltrelew";
      case "portalsantiago":
        return "portalsantiago";
      case "portallosandes":
        return "portallosandes";
      case "portalsalta":
        return "portalsalta";
      case "portalpalermo":
        return "portalpalermo";
      case "portalpalermo":
        return "portalpalermo";
      case "portalescobar":
        return "portalescobar";
      case "factoryparquebrown":
        return "factoryparquebrown";
      case "factoryquilmes":
        return "factoryquilmes";
      case "factorysanmartin":
        return "factorysanmartin";
      case "corona":
        return "corona";
      case "gancia":
        return "gancia";
      case "jazminchebar":
        return "jazminchebar";
      default:
        return subdomain;
    }
  } else {
    return default_brand;
  }
}

function getWhitelabelException() {
  var exceptions = [
    {
      whitelabel: "interceramic",
      experiences: [
        "Terraza_StaMonica",
        "Cocina_StaMonica",
        "Sala_Satori",
        "Cocina_Satori",
      ],
    },
    {
      whitelabel: "disney",
      experiences: ["twdc"],
    },
    {
      whitelabel: "nespresso",
      experiences: ["nespresso"],
    },
    {
      whitelabel: "bancoazteca",
      experiences: ["banco-azteca-tarjeta"],
    },
  ];

  for (var i = 0; i < exceptions.length; i++) {
    for (var j = 0; j < exceptions[i].experiences.length; j++) {
      if (window.location.search.indexOf(exceptions[i].experiences[j]) >= 0) {
        return exceptions[i].whitelabel;
      }
    }
  }

  return null;
}

function getWhitelabelBrand() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("w")) {
    return urlParams.get("w");
  } else {
    var exception = getWhitelabelException();
    if (
      window.location.hostname.substring(
        0,
        window.location.hostname.lastIndexOf(".camonapp")
      ) === "disney"
    ) {
      config.onlyMobile = true;
      config.backurl = "https://disney.camonapp.com/hygge-wip/#";
    }
    return exception != null ? exception : getWhitelabelBrandFromSubdomain();
  }
}

function logEventView() {
  const defaultAnalytics = firebase.analytics();
  defaultAnalytics.logEvent("view_item", {
    items: [{ name: xr.model }],
  });
}

function qs(key) {
  key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&");
  var match = location.search.match(new RegExp("[?&]" + key + "=([^&]+)(&|$)"));
  return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

function animateLoader(right) {
  if ($("#mv").length > 0 && $("#mv")[0].loaded) return;

  $(".loading-indicator-inner").animate(
    {
      left: right ? 138 : -2,
    },
    1000,
    function () {
      animateLoader(!right);
    }
  );
}

function setupLoader(parent) {
  var html = `
    <div class="preloader">
        <div class="preloader-header">
            <img src="{image_url}icon3d.svg" /> <br />
            <span>{txt_loading_1}<br /><span class="bold">{txt_loading_2}</span></span>
        </div>

        <div class="preloader-center">
            <div class="preloader-bg" />
            <div class="preloader-container">
           
            <div class="loading">
              <div class="loading-content">
                <span class="bold">{txt_3d}</span>
                <div class="logo-3d"></div>
              </div>
              <div class="loading-indicator">
                <div class="loading-indicator-inner"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
            <span class="text">{txt_powered_by_1}</span>
            <span class="bold">{txt_powered_by_2}</span>
            <div class="logo"></div>
            
        </div>
    </div>`;
  html = html.replace(new RegExp("{txt_loading_1}", "g"), i18n.t("loading_1"));
  html = html.replace(new RegExp("{txt_loading_2}", "g"), i18n.t("loading_2"));
  html = html.replace(new RegExp("{txt_3d}", "g"), i18n.t("main_3d"));
  html = html.replace(
    new RegExp("{txt_powered_by_1}", "g"),
    i18n.t("powered_by_1")
  );
  html = html.replace(
    new RegExp("{txt_powered_by_2}", "g"),
    i18n.t("powered_by_2")
  );
  html = html.replace(
    new RegExp("{image_url}", "g"),
    brandResourcesUrl + "img/"
  );

  parent.append(html);

  animateLoader(true);
}

function setupQR(parent) {
  var backHtml = `
        <div class="qr_redirect" style="visibility:${
          config.backUrl ? "visible" : "hidden"
        }">
            <span class="qr_redirect--text">{product_3d_back}</span> <a href="${
              config.backUrl
            }"> {product_3d_click}</a>
        </div>
    `;
  backHtml = backHtml.replace(
    new RegExp("{product_3d_back}", "g"),
    i18n.t("product_3d_back")
  );
  backHtml = backHtml.replace(
    new RegExp("{product_3d_click}", "g"),
    i18n.t("product_3d_click")
  );

  var html = `
    <div class="qr_section">
        <div class="qr_container">
            <div class="qr_logo" > </div>
            <div class="qr_border">
                <div class="qr_code">

                </div>
            </div>
            <div class="qr_container--description">
                <span class="qr_container--text">{txt_no_ar_1_available}</span>
                <span class="qr_container--text2">{txt_no_ar_2_available}</span>
            </div>
        </div>
        <div class="qr_view">
            <span class="qr_view--text">{product_3d_text}</span>
            <button class="qr_view--button" id="onShow">{product_3d_button}</button>
        </div>
        ${backHtml}
    </div>

    `;
  html = html.replace(
    new RegExp("{txt_no_ar_1_available}", "g"),
    i18n.t("no_ar_available_1")
  );
  html = html.replace(
    new RegExp("{txt_no_ar_2_available}", "g"),
    i18n.t("no_ar_available_2")
  );
  html = html.replace(
    new RegExp("{product_3d_text}", "g"),
    i18n.t("product_3d_text")
  );
  html = html.replace(
    new RegExp("{product_3d_button}", "g"),
    i18n.t("product_3d_button")
  );

  parent.append(html);
  animateLoader(true);
  $("#onShow").click(() => {
    show();
  });
}

function initBrand() {
  brand = getWhitelabelBrand();
  brandResourcesUrl = baseUrl + "resources/" + brand + "/";
  $("head").append(
    $('<link href="' + brandResourcesUrl + 'css/brand.css" rel="stylesheet" />')
  );
  $("head").append(
    $('<script src="' + brandResourcesUrl + 'config.js"></script>')
  );
  i18n.init(init);
}

function show() {
  $(".qr_section").fadeOut();
  $("#mv").css("visibility", "visible");
  if ($("#start-ar").is(":visible")) {
    $("#downContainer").css("visibility", "visible");
  }
}
function postCustomMessageEvent(e) {
  console.log("AR Event: " + e);

  if (inIframe()) {
    window.parent.postMessage(
      {
        model: xr.model,
        event: e,
      },
      "*"
    );
  }
}

function handleARStatus(status, comingFromARStatus) {
  switch (status) {
    case "session-started":
      // We ignore session-started from ar-status, and handle it here (otherwise it fires to the parent window after session-ended)
      if (!comingFromARStatus) postCustomMessageEvent("ar_session_started");
      break;
    case "object-placed":
      postCustomMessageEvent("ar_object_placed");
      break;
    case "not-presenting":
      postCustomMessageEvent("ar_session_ended");
      break;
    case "failed":
      $("#start-ar").hide();
      postCustomMessageEvent("ar_failed");
      break;
  }
}

function deviceIsAndroid() {
  return /android/i.test(navigator.userAgent);
}

function setupAnalyticsCommonData(data) {
  analyticsCommonData.customerId = data.client_id;
  analyticsCommonData.campaignId = data.campaign_id;
  analyticsCommonData.experienceId = data.experience_id;
}

function getUrlVars() {
  var vars = [],
    hash;
  var hashes = window.location.href
    .slice(window.location.href.indexOf("?") + 1)
    .split("&");
  for (var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split("=");
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
  }
  return vars;
}

function init() {
  var _loadingInitTime = Date.now();
  document.title = i18n.t("document_title");

  let iconQS =
    getUrlVars(window.location).w || getWhitelabelBrandFromSubdomain();

  if (iconQS) {
    $.get("resources/" + iconQS + "/img/favicon.ico")
      .done(function () {
        $("#favicon").attr("href", "resources/" + iconQS + "/img/favicon.ico");
      })
      .fail(function () {
        $("#favicon").attr("href", "resources/camonapp/img/favicon.ico");
      });
  } else {
    $("#favicon").attr("href", "resources/camonapp/img/favicon.ico");
  }

  $("#model").hide();
  $("#model").css("visibility", "visible");
  $("#model").fadeIn();

  xr.model = qs("model") != null ? qs("model") : xr.model;
  xr.ar =
    qs("ar") != null ? qs("ar") === "true" : xr.ar !== undefined ? xr.ar : true;
  xr.autoRotate =
    qs("autoRotate") != null
      ? qs("autoRotate") === "true"
      : xr.autoRotate !== undefined
      ? xr.autoRotate
      : true;
  xr.cameraControls =
    qs("cameraControls") != null
      ? qs("cameraControls") === "true"
      : xr.cameraControls !== undefined
      ? xr.cameraControls
      : true;
  xr.backgroundColor =
    qs("backgroundColor") != null
      ? qs("backgroundColor")
      : xr.backgroundColor !== undefined
      ? xr.backgroundColor
      : "#fff";

  setupLoader($(xr.dest));
  // this function get info for analytics register and then mark one view.
  fetch(api_lambda_getExperienceForMonorail_url + "?nameModel=" + xr.model)
    .then((response) => response.json())
    .then((data) => {
      setupAnalyticsCommonData(data);
      logManager.logExperienceView();
    })
    .catch((err) => console.log("ERROR", err));

  var mv = $(
    '<model-viewer id="mv" ' +
      `${config.bottomAction ? 'style="height:85%"' : ""}` +
      ' autoplay quick-look-browsers="safari chrome" src="' +
      assetsUrl +
      xr.model +
      '.glb" ios-src="' +
      assetsUrl +
      xr.model +
      '.usdz" style="width:100%;height:100%; background-color: unset"></model-viewer>'
  );
  mv.css("visibility", "hidden");
  mv.css("position", "absolute");
  mv.css("--progress-bar-color", "rgba(0, 0, 0, 0)");
  var startAR = $(
    '<div slot="ar-button" id="start-ar" class="start-ar"' +
      `${
        config.bottomAction ? 'style="visibility:hidden"' : "visibility:visible"
      }` +
      '><div class="start-ar-logo"></div><span>' +
      i18n.t("start_ar") +
      "</span></div>"
  );
  startAR.click(function () {
    handleARStatus("session-started", false);
  });
  mv.append(startAR);

  // ar-status works ONLY on Android devices
  mv.on("ar-status", function (event) {
    handleARStatus(event.originalEvent.detail.status, true);
  });
  // mv.on("quick-look-button-tapped", function() {
  //     console.log("quick-look-button-tapped");
  // });

  if (xr.ar) mv.attr("ar", "");
  if (xr.autoRotate) mv.attr("auto-rotate", "");
  if (xr.cameraControls) mv.attr("camera-controls", "");
  if (xr.backgroundColor) mv.attr("background-color", xr.backgroundColor);
  mv.on("load", function () {
    let loadingTime = Date.now() - _loadingInitTime;
    logManager.logExperienceLoadTime(loadingTime);
    logEventView();
    $(".preloader").fadeOut();
    if (!deviceIsMobile() && config.onlyMobile) {
      setupQR($(xr.dest));
      mv.css("visibility", "hidden");
      $("#downContainer").css("visibility", "hidden");

      setTimeout(() => {
        showQR();
      }, 100);
    } else {
      mv.css("visibility", "visible");
      $("#downContainer").css("visibility", "visible");
      if ($("#start-ar").is(":visible")) {
        //$('#start-ar').trigger('click');
        $("#downContainer").css("visibility", "visible");
      }
    }
  });
  $(xr.dest).append(mv);
  if (config.bottomAction) {
    //TODO: aca va el boton en caso de que se setee la opcion del boton abajo
    //Acá se pidió dejar un texto solo en caso de que sea la experiencia "liverpool"
    //Se trató de tryhardear lo menos posible hasta donde el bendito jquery lo permite

    let _lang = i18n.getPreferredLang();

    console.log(_lang);

    var downContainer = `
        <div id="downContainer" class="down-container" style="width: 100%; margin-right:  5px;">
            <div class="start-ar-title-down">
                <span>${i18n.t("start_ar_title")}
                </span>
            </div>
            <div id="start-ar-down" class="start-ar-down" style="position: initial;">
                <div class="start-ar-logo"></div>
                <span> ${i18n.t("start_ar_down")}
                </span>
            </div>
        </div>`;

    $(xr.dest).append(downContainer);
    $("#start-ar-down").click(() => {
      if (config.bottomCall === "default" || config.bottomCall == undefined) {
        $("#start-ar").trigger("click");
      } else {
        window.open(config.bottomCall, "_blank");
      }
    });
  }
}
function deviceIsMobile() {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}
function showQR() {
  //$(".loading, .preloader-header").fadeOut();
  new QRCode($(".qr_code")[0], {
    text: window.location.href,
    colorDark: "#000",
    colorLight: "#ffffff",
    quietZone: 25,
    width: 180,
    height: 180,
    onRenderingEnd: function (qrCodeOptions, dataURL) {
      $(".qr_section").fadeIn();
    },
  });
}
$(initBrand);

window.addEventListener("load", () => {
  console.log(window.config);
});
