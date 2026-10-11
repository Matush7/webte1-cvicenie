// script.js - one file for all pages. Each part first checks
// that its elements exist on the current page.

// ---------- Constants ----------
const SEMESTER_START = "14.09.2026";
const SEMESTER_END = "12.12.2026";

const STORAGE_KEY = "webte1-z1-points";

const SCHOOL = { name: "FEI STU, Bratislava", lat: 48.151965, lng: 17.072995 };
const HOME = { name: "Domov, Žilina", lat: 49.2234, lng: 18.7399 };

// Hotspots of the workspace picture, x and y are percent of the image size
const HOTSPOTS = [
  { x: 10, y: 18, title: "Lampa", text: "Využívam ju večer namiesto hlavného svetla." },
  { x: 18, y: 87, title: "Zápisník", text: "Zapisujem si tu rôzne nápady." },
  { x: 54, y: 40, title: "Hlavný monitor", text: "Na ňom vznikajú moji AI agenti a automatizácie, ale aj úpravy fotiek a nové aplikácie." },
  { x: 82, y: 89, title: "Myška", text: "Potrpím si na kvalitnú myšku s dobrou odozvou a tým správnym klikom." },
  { x: 82, y: 34, title: "Rastlina", text: "Trochu zanedbávam polievanie, ale vytvára na stole dobrý dojem." },
  { x: 54, y: 84, title: "Klávesnica", text: "Najlepšia je bezdrôtová, lebo nemám rád, keď sú všade káble." }
];

// ---------- Hamburger menu (all pages) ----------
// the class "js" lets CSS collapse the menu only when JS really runs
document.documentElement.classList.add("js");

const toggle = document.querySelector(".site-nav__toggle");
const menu = document.querySelector(".site-nav__list");

if (toggle && menu) {
  toggle.addEventListener("click", function () {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen);
  });
}

// ---------- Hotspots (workspace.html) ----------
// JS only creates the elements, the look and behaviour is pure CSS.
const figure = document.querySelector(".hotspot-image");

if (figure) {
  HOTSPOTS.forEach(function (item) {
    const hotspot = document.createElement("div");
    hotspot.className = "hotspot";
    if (item.x > 50) {
      hotspot.classList.add("hotspot--left");
    }
    hotspot.style.setProperty("--x", item.x + "%");
    hotspot.style.setProperty("--y", item.y + "%");

    const dot = document.createElement("button");
    dot.className = "hotspot__dot";
    dot.type = "button";
    dot.setAttribute("aria-label", item.title);

    const panel = document.createElement("div");
    panel.className = "hotspot__panel";

    const title = document.createElement("h3");
    title.textContent = item.title;

    const text = document.createElement("p");
    text.textContent = item.text;

    panel.append(title, text);
    hotspot.append(dot, panel);
    figure.append(hotspot);
  });
}

// ---------- Schedule (schedule.html) ----------
const table = document.querySelector(".schedule");

if (table) {
  const lessons = table.querySelectorAll("td[data-start]");

  // "10:30" -> 630 minutes
  function toMinutes(time) {
    const parts = time.split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  // Current lesson
  const now = new Date();
  const day = now.getDay(); // 1 = Monday ... 5 = Friday
  const minutes = now.getHours() * 60 + now.getMinutes();
  const status = document.querySelector("#schedule-status");
  let found = false;

  lessons.forEach(function (cell) {
    const row = cell.parentElement;
    if (Number(row.dataset.day) !== day) {
      return;
    }
    if (minutes >= toMinutes(cell.dataset.start) && minutes < toMinutes(cell.dataset.end)) {
      cell.classList.add("current");
      status.textContent = "Práve prebieha: " + cell.querySelector(".lesson__name").textContent + " (" + cell.dataset.start + " – " + cell.dataset.end + ").";
      found = true;
    }
  });

  function findNext() {
    for (let offset = 0; offset < 7; offset++) {
      const d = (day + offset) % 7;
      const row = table.querySelector('tr[data-day="' + d + '"]');
      if (!row) {
        continue; // saturday and sunday, no lessons
      }
      const cells = row.querySelectorAll("td[data-start]");
      for (const cell of cells) {
        if (offset > 0 || toMinutes(cell.dataset.start) > minutes) {
          return { cell: cell, day: d, offset: offset };
        }
      }
    }
    return null;
  }

  if (!found) {
    const dayNames = ["v nedeľu", "v pondelok", "v utorok", "v stredu", "vo štvrtok", "v piatok", "v sobotu"];
    const next = findNext();
    let text = "Práve nič neprebieha.";
    if (day === 0 || day === 6) {
      text = "Dnes je víkend, výučba neprebieha.";
    }
    if (next) {
      const when = next.offset === 0 ? "dnes" : dayNames[next.day];
      text += " Najbližšia hodina: " + next.cell.querySelector(".lesson__name").textContent +
        " " + when + " o " + next.cell.dataset.start + ".";
    }
    status.textContent = text;
  }

  // Filter
  const buttons = document.querySelectorAll(".filter button");
  const empty = document.querySelector("#schedule-empty");

  document.querySelector(".filter").hidden = false;

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      const type = button.dataset.filter;
      let shown = 0;

      buttons.forEach(function (other) {
        other.setAttribute("aria-pressed", other === button);
      });

      lessons.forEach(function (cell) {
        if (type === "all" || cell.dataset.type === type) {
          cell.classList.remove("filtered-out");
          shown++;
        } else {
          cell.classList.add("filtered-out");
        }
      });

      document.querySelector(".table-scroll").hidden = shown === 0;
      empty.hidden = shown > 0;
    });
  });

  // Semester progress, dates are in the format DD.MM.YYYY
  function parseDate(text) {
    const parts = text.split(".");
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }

  const start = parseDate(SEMESTER_START);
  const end = parseDate(SEMESTER_END);
  const bar = document.querySelector("#semester-progress");
  const label = document.querySelector("#semester-label");
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.round((end - start) / dayMs) + 1;

  if (now < start) {
    bar.value = 0;
    label.textContent = "Semester sa ešte nezačal, začína " + SEMESTER_START + ".";
  } else if (now > end) {
    bar.value = 100;
    label.textContent = "Semester sa skončil " + SEMESTER_END + ".";
  } else {
    const passedDays = Math.floor((now - start) / dayMs) + 1;
    const percent = Math.round((passedDays / totalDays) * 100);
    bar.value = percent;
    label.textContent = "Prebehlo " + percent + " % semestra (" + passedDays + ". deň z " + totalDays + ").";
  }
}

// ---------- Map (map.html) ----------
const mapElement = document.querySelector("#map");

if (mapElement) {
  const errorText = document.querySelector("#map-error");

  if (typeof L === "undefined") {
    // Leaflet did not load (no internet)
    errorText.hidden = false;
  } else {
    const map = L.map("map").setView([48.9, 18.0], 8);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // the line colour is read from :root, so no colour value is repeated here
    const lineColor = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();

    const list = document.querySelector("#points-list");
    const emptyText = document.querySelector("#points-empty");
    const fromSelect = document.querySelector("#from");
    const toSelect = document.querySelector("#to");
    const result = document.querySelector("#distance-result");
    const addCenterButton = document.querySelector("#add-center");

    // all points: school, home and the points added by the visitor
    // index 0 = school, 1 = home, 2+ = own points
    const points = [SCHOOL, HOME];
    const markers = [
      L.marker([SCHOOL.lat, SCHOOL.lng], { alt: "Škola: " + SCHOOL.name }).addTo(map).bindPopup("Škola: " + SCHOOL.name),
      L.marker([HOME.lat, HOME.lng], { alt: HOME.name }).addTo(map).bindPopup(HOME.name)
    ];
    let line = null; // the polyline between the two selected points

    // Haversine formula, result in km
    function haversine(lat1, lng1, lat2, lng2) {
      const R = 6371;
      const toRad = Math.PI / 180;
      const dLat = (lat2 - lat1) * toRad;
      const dLng = (lng2 - lng1) * toRad;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // removes the old line and the labels next to the markers
    function clearConnection() {
      if (line) {
        map.removeLayer(line);
        line = null;
      }
      markers.forEach(function (marker) {
        marker.unbindTooltip();
      });
    }

    function showDistance() {
      const fromIndex = Number(fromSelect.value);
      const toIndex = Number(toSelect.value);
      const from = points[fromIndex];
      const to = points[toIndex];

      clearConnection();

      if (fromIndex === toIndex) {
        result.textContent = "Vyberte dva rôzne body.";
        return;
      }

      const km = haversine(from.lat, from.lng, to.lat, to.lng).toFixed(1);
      result.textContent = from.name + " → " + to.name + ": vzdušnou čiarou " + km + " km.";

      // the connection line and a label with name and distance at both ends
      line = L.polyline([[from.lat, from.lng], [to.lat, to.lng]], { color: lineColor, weight: 4 }).addTo(map);
      markers[fromIndex].bindTooltip(from.name + ": " + km + " km", { permanent: true, direction: "top", offset: [0, -40] }).openTooltip();
      markers[toIndex].bindTooltip(to.name + ": " + km + " km", { permanent: true, direction: "top", offset: [0, -40] }).openTooltip();
      // extra space on top, so the labels above the markers are not cut off
      map.fitBounds(line.getBounds(), { paddingTopLeft: [60, 110], paddingBottomRight: [60, 40] });
    }

    // "from" offers every point, "to" only the school or home
    function fillSelect(select, count, selected) {
      select.replaceChildren();
      points.slice(0, count).forEach(function (point, index) {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = point.name;
        select.append(option);
      });
      select.value = selected;
    }

    function save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(points.slice(2)));
      } catch (error) {
        // localStorage is not available, points just will not be remembered
      }
    }

    // fromIndex = which point should be selected in "from"
    function refresh(fromIndex) {
      // list of own points
      list.replaceChildren();
      points.slice(2).forEach(function (point, i) {
        const item = document.createElement("li");
        item.textContent = point.name + " (" + point.lat.toFixed(4) + ", " + point.lng.toFixed(4) + ")";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn";
        button.textContent = "Zmazať";
        button.setAttribute("aria-label", "Zmazať bod " + point.name);
        button.addEventListener("click", function () {
          removePoint(i + 2);
        });

        item.append(button);
        list.append(item);
      });
      emptyText.hidden = points.length > 2;

      // selects
      fillSelect(fromSelect, points.length, fromIndex);
      fillSelect(toSelect, 2, 0);
      showDistance();
    }

    function addPoint(point) {
      points.push(point);
      markers.push(L.marker([point.lat, point.lng], { alt: point.name }).addTo(map).bindPopup(point.name));
    }

    function removePoint(index) {
      clearConnection();
      map.removeLayer(markers[index]);
      markers.splice(index, 1);
      points.splice(index, 1);
      save();
      refresh(points.length > 2 ? points.length - 1 : 1);
    }

    // asks for a name and adds the point, the new point is selected in "from"
    function addNamedPoint(lat, lng) {
      const name = prompt("Názov nového bodu:");
      if (name === null || name.trim() === "") {
        return;
      }
      addPoint({ name: name.trim(), lat: lat, lng: lng });
      save();
      refresh(points.length - 1);
    }

    // load saved points
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved)) {
        saved.forEach(addPoint);
      }
    } catch (error) {
      // nothing saved or storage is not available
    }

    map.on("click", function (event) {
      addNamedPoint(event.latlng.lat, event.latlng.lng);
    });

    // keyboard alternative: move the map with the arrow keys, then add the centre
    document.querySelector("#keyboard-add").hidden = false;
    addCenterButton.addEventListener("click", function () {
      const center = map.getCenter();
      addNamedPoint(center.lat, center.lng);
    });

    fromSelect.addEventListener("change", showDistance);
    toSelect.addEventListener("change", showDistance);

    // default: last own point (if any) to school, otherwise home to school
    refresh(points.length > 2 ? points.length - 1 : 1);
  }
}
