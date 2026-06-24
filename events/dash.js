(function () {
  "use strict";

  var EVENT_DIR = "data/" + (new URLSearchParams(window.location.search).get("event") || "demo-2026") + "/";
  var DATA = null;

  fetch(EVENT_DIR + "event.json")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      DATA = data;
      populateGate(data);
      if (sessionStorage.getItem("dash_" + data.name) === "1") showDashboard();
    })
    .catch(function () {
      document.getElementById("gateEventName").textContent = "Event not found";
    });

  /* ---- Gate ---- */
  function populateGate(d) {
    document.getElementById("gateEventName").textContent = d.name;
    document.getElementById("gateEventSub").textContent = d.subtitle || "";
    document.title = d.name + " — PXLPTR";
  }

  document.getElementById("gateForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!DATA) return;
    if (document.getElementById("gatePass").value === DATA.passwordHash) {
      sessionStorage.setItem("dash_" + DATA.name, "1");
      showDashboard();
    } else {
      document.getElementById("gateError").textContent = "Incorrect code";
      document.getElementById("gatePass").value = "";
    }
  });

  /* ---- Show Dashboard ---- */
  function showDashboard() {
    document.getElementById("gate").style.display = "none";
    document.getElementById("dash").classList.remove("hidden");
    renderAll(DATA);
    initNav();
  }

  function renderAll(d) {
    // Sidebar
    document.getElementById("sbEvent").textContent = d.name;
    document.getElementById("sbMeta").textContent = d.subtitle || "";
    document.getElementById("topbarEvent").textContent = d.name;

    renderOverview(d);
    renderAnnouncements(d);
    renderContacts(d);
    renderSchedule(d);
    renderVenue(d);
    renderFiles(d);
    fetchWeather(d);
    startCountdown(d);
  }

  /* ---- Nav ---- */
  function initNav() {
    var links = document.querySelectorAll(".sb-link");

    links.forEach(function (a) {
      a.addEventListener("click", function () { closeMobileMenu(); });
    });

    var toggle = document.getElementById("menuToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        document.body.classList.toggle("menu-open");
      });
    }

    document.addEventListener("click", function (e) {
      if (document.body.classList.contains("menu-open") &&
          !e.target.closest(".sidebar") && !e.target.closest(".topbar-hamburger")) {
        closeMobileMenu();
      }
    });

    var panels = document.querySelectorAll(".panel");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          links.forEach(function (l) {
            l.classList.toggle("active", l.dataset.section === id);
          });
        }
      });
    }, { rootMargin: "-20% 0px -60% 0px" });

    panels.forEach(function (p) { observer.observe(p); });
  }

  function closeMobileMenu() {
    document.body.classList.remove("menu-open");
  }

  /* ---- Overview ---- */
  function renderOverview(d) {
    document.getElementById("ovEvent").textContent = d.name;
    document.getElementById("ovSub").textContent = d.subtitle || "";

    var start = new Date(d.date + "T00:00:00");
    var end = d.dateEnd ? new Date(d.dateEnd + "T00:00:00") : null;
    var opts = { month: "long", day: "numeric", year: "numeric" };
    var dateStr = start.toLocaleDateString("en-US", opts);
    if (end && end.getTime() !== start.getTime()) {
      dateStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        + " – " + end.toLocaleDateString("en-US", opts);
    }
    document.getElementById("ovDate").textContent = dateStr;
    document.getElementById("ovVenue").textContent = d.venue.name;
    document.getElementById("ovMap").href = d.venue.mapUrl || "#";
  }

  function startCountdown(d) {
    var el = document.getElementById("countdown");
    var target = new Date(d.date + "T00:00:00").getTime();
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) { el.textContent = "EVENT DAY"; return; }
      var days = Math.floor(diff / 86400000);
      var hrs = Math.floor((diff % 86400000) / 3600000);
      el.textContent = days + "d " + hrs + "h";
    }
    tick();
    setInterval(tick, 60000);
  }

  /* ---- Weather ---- */
  function fetchWeather(d) {
    var c = d.venue.coords;
    if (!c) return;
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + c.lat
      + "&longitude=" + c.lon
      + "&current=temperature_2m,weather_code"
      + "&daily=temperature_2m_max,temperature_2m_min"
      + "&temperature_unit=fahrenheit&timezone=auto&forecast_days=3";

    fetch(url).then(function (r) { return r.json(); }).then(function (wx) {
      var cur = wx.current;
      var desc = weatherDesc(cur.weather_code);
      document.getElementById("ovWeather").textContent = Math.round(cur.temperature_2m) + "°F · " + desc;
      document.getElementById("sbWeather").innerHTML =
        "<strong>" + Math.round(cur.temperature_2m) + "°</strong> " + desc + "<br>" + d.venue.name;
    }).catch(function () {});
  }

  function weatherDesc(code) {
    if (code <= 1) return "Clear";
    if (code <= 3) return "Partly cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 67) return "Rain";
    if (code <= 77) return "Snow";
    if (code <= 86) return "Showers";
    return "Storms";
  }

  /* ---- Announcements ---- */
  function renderAnnouncements(d) {
    var anns = (d.announcements || []).slice().reverse();
    document.getElementById("annCount").textContent = anns.length;
    var list = document.getElementById("annList");
    if (!anns.length) { list.innerHTML = '<p style="color:var(--text-3);font-size:0.8rem">No updates.</p>'; return; }

    list.innerHTML = anns.map(function (a) {
      var dt = new Date(a.time);
      var ts = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        + " " + dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return '<div class="ann-item">'
        + '<div class="ann-badge ann-badge--' + a.level + '">' + a.level + '</div>'
        + '<div><div class="ann-text">' + a.text + '</div>'
        + '<div class="ann-time">' + ts + '</div></div></div>';
    }).join("");
  }

  /* ---- Contacts ---- */
  function renderContacts(d) {
    var contacts = d.contacts || [];
    var cats = [];
    contacts.forEach(function (c) { if (cats.indexOf(c.category) === -1) cats.push(c.category); });

    var bar = document.getElementById("contactFilters");
    bar.innerHTML = '<button class="filter-btn active" data-cat="all">All</button>'
      + cats.map(function (c) { return '<button class="filter-btn" data-cat="' + c + '">' + c + '</button>'; }).join("");

    drawContacts(contacts, "all");

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      bar.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      drawContacts(contacts, btn.dataset.cat);
    });
  }

  function drawContacts(contacts, cat) {
    var filtered = cat === "all" ? contacts : contacts.filter(function (c) { return c.category === cat; });
    document.getElementById("contactGrid").innerHTML = filtered.map(function (c) {
      var actions = [];
      if (c.phone) actions.push('<a class="contact-act dept-' + c.category + '" href="tel:' + c.phone.replace(/[^\d+]/g, '') + '">Call</a>');
      if (c.email) actions.push('<a class="contact-act dept-' + c.category + '" href="mailto:' + c.email + '">Email</a>');
      return '<div class="contact-card">'
        + '<div class="contact-dept dept-' + c.category + '">' + c.category + '</div>'
        + '<div class="contact-name">' + c.name + '</div>'
        + '<div class="contact-role">' + c.role + '</div>'
        + (c.company ? '<div class="contact-company">' + c.company + '</div>' : '')
        + (actions.length ? '<div class="contact-actions">' + actions.join("") + '</div>' : '')
        + '</div>';
    }).join("");
  }

  /* ---- Schedule ---- */
  function renderSchedule(d) {
    var schedule = d.schedule || [];
    var days = [];
    schedule.forEach(function (s) { if (days.indexOf(s.day) === -1) days.push(s.day); });

    var start = new Date(d.date + "T00:00:00");
    var bar = document.getElementById("scheduleTabs");
    bar.innerHTML = days.map(function (day, i) {
      var dt = new Date(start); dt.setDate(dt.getDate() + (day - 1));
      var label = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return '<button class="filter-btn' + (i === 0 ? " active" : "") + '" data-day="' + day + '">' + label + '</button>';
    }).join("");

    drawSchedule(schedule, days[0] || 1);

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      bar.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      drawSchedule(schedule, parseInt(btn.dataset.day));
    });
  }

  function drawSchedule(schedule, day) {
    var items = schedule.filter(function (s) { return s.day === day; });
    document.getElementById("schedBody").innerHTML = items.map(function (s) {
      var t = s.time.split(":");
      var h = parseInt(t[0]);
      var ampm = h >= 12 ? "PM" : "AM";
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      var timeStr = h + ":" + t[1] + " " + ampm;
      return '<tr>'
        + '<td class="sched-td"><span class="sched-time">' + timeStr + '</span></td>'
        + '<td class="sched-td">' + s.label + '</td>'
        + '<td class="sched-td"><span class="sched-dept dept-' + s.dept + '">' + s.dept + '</span></td>'
        + '</tr>';
    }).join("");
  }

  /* ---- Venue ---- */
  function renderVenue(d) {
    var v = d.venue;
    var cards = [
      { l: "Address", v: '<a href="' + (v.mapUrl || "#") + '" target="_blank">' + v.address + '</a>' },
      { l: "Load-in", v: v.loadIn },
      { l: "Power", v: v.power, full: true },
      { l: "WiFi", v: v.wifi ? 'Network: <strong>' + v.wifi.network + '</strong> · Password: <strong>' + v.wifi.password + '</strong>' : '' },
      { l: "Parking", v: v.parking },
    ];
    if (v.notes) cards.push({ l: "Notes", v: v.notes, full: true });

    document.getElementById("venueGrid").innerHTML = cards.filter(function (c) { return c.v; }).map(function (c) {
      return '<div class="venue-card' + (c.full ? " venue-card--full" : "") + '">'
        + '<div class="venue-label">' + c.l + '</div>'
        + '<div class="venue-val">' + c.v + '</div></div>';
    }).join("");
  }

  /* ---- Files ---- */
  function renderFiles(d) {
    var files = d.files || [];
    var cats = [];
    files.forEach(function (f) { if (cats.indexOf(f.category) === -1) cats.push(f.category); });

    var bar = document.getElementById("fileFilters");
    bar.innerHTML = '<button class="filter-btn active" data-cat="all">All</button>'
      + cats.map(function (c) { return '<button class="filter-btn" data-cat="' + c + '">' + c + '</button>'; }).join("");

    drawFiles(files, "all");

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      bar.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      drawFiles(files, btn.dataset.cat);
    });
  }

  function drawFiles(files, cat) {
    var filtered = cat === "all" ? files : files.filter(function (f) { return f.category === cat; });
    document.getElementById("fileBody").innerHTML = filtered.map(function (f) {
      var href = EVENT_DIR + f.path;
      return '<tr>'
        + '<td class="file-td"><span class="file-name">' + f.name + '</span></td>'
        + '<td class="file-td"><span class="file-cat">' + f.category + '</span></td>'
        + '<td class="file-td"><span class="file-size">' + f.size + '</span></td>'
        + '<td class="file-td"><a class="file-dl" href="' + href + '" download>Download</a></td>'
        + '</tr>';
    }).join("");
  }

})();
