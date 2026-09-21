/* =========================================================
   STANDPOINT V1.0
   HUNT. TRACK. SCOUT.
========================================================= */

"use strict";


/* =========================================================
   SPLASH
========================================================= */

window.addEventListener("load", function () {

    setTimeout(function () {

        const splash =
            document.getElementById("splash-screen");

        if (!splash) return;

        splash.classList.add("hidden");

        setTimeout(function () {
            splash.style.display = "none";
        }, 750);

    }, 1500);

});


/* =========================================================
   APPLICATION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       STORAGE KEYS
    ===================================================== */

    const MARKER_STORAGE = "standpointMarkers";
    const HUNT_STORAGE = "standpointHunts";


    /* =====================================================
       STATE
    ===================================================== */

    let map = null;

    let streetLayer = null;
    let satelliteLayer = null;

    let currentMapLayer = "satellite";

    let currentLatitude = null;
    let currentLongitude = null;
    let currentAccuracy = null;

    let currentLocationMarker = null;
    let accuracyCircle = null;

    let locationWatchId = null;

    let mapSelectionMarker = null;

    let pendingMarkerLocation = null;
    let pendingMarkerType = null;

    let selectedMarkerId = null;
    let selectedHuntId = null;

    let leafletMarkers = {};

    let huntActive = false;
    let huntStartTime = null;
    let huntTimerInterval = null;

    let huntPath = [];
    let huntDistanceMiles = 0;
    let huntRouteLine = null;

    let displayedHistoryRoute = null;

    let currentHeading = null;

    let weatherData = null;

    let toastTimer = null;


    /* =====================================================
       DOM
    ===================================================== */

    const navButtons =
        document.querySelectorAll(".nav-button");

    const pages =
        document.querySelectorAll(".page");

    const settingsButton =
        document.getElementById("settings-button");

    const centerGpsButton =
        document.getElementById("center-gps");

    const addMarkerButton =
        document.getElementById("add-marker");

    const layersButton =
        document.getElementById("layers-button");

    const mapTip =
        document.getElementById("map-tip");

    const headingDisplay =
        document.getElementById("heading");

    const windDisplay =
        document.getElementById("wind");

    const startHuntButton =
        document.getElementById("start-hunt");

    const huntPageStartButton =
        document.getElementById("hunt-page-start");

    const huntStatus =
        document.getElementById("hunt-status");

    const huntTime =
        document.getElementById("hunt-time");

    const huntDistance =
        document.getElementById("hunt-distance");

    const huntHeading =
        document.getElementById("hunt-heading");

    const huntGpsStatus =
        document.getElementById("hunt-gps-status");

    const huntHistory =
        document.getElementById("hunt-history");

    const markerModal =
        document.getElementById("marker-modal");

    const closeMarkerButton =
        document.getElementById("close-marker");

    const markerModalDescription =
        document.getElementById(
            "marker-modal-description"
        );

    const markerButtons =
        document.querySelectorAll(
            ".marker-grid button[data-marker]"
        );

    const markerDetailsModal =
        document.getElementById(
            "marker-details-modal"
        );

    const closeMarkerDetails =
        document.getElementById(
            "close-marker-details"
        );

    const markerDetailsTitle =
        document.getElementById(
            "marker-details-title"
        );

    const markerName =
        document.getElementById("marker-name");

    const markerNotes =
        document.getElementById("marker-notes");

    const markerCoordinatePreview =
        document.getElementById(
            "marker-coordinate-preview"
        );

    const saveMarkerDetails =
        document.getElementById(
            "save-marker-details"
        );

    const savedMarkersModal =
        document.getElementById(
            "saved-markers-modal"
        );

    const savedMarkerList =
        document.getElementById(
            "saved-marker-list"
        );

    const closeSavedMarkers =
        document.getElementById(
            "close-saved-markers"
        );

    const editMarkerModal =
        document.getElementById(
            "edit-marker-modal"
        );

    const closeEditMarker =
        document.getElementById(
            "close-edit-marker"
        );

    const editMarkerType =
        document.getElementById(
            "edit-marker-type"
        );

    const editMarkerName =
        document.getElementById(
            "edit-marker-name"
        );

    const editMarkerNotes =
        document.getElementById(
            "edit-marker-notes"
        );

    const updateMarkerButton =
        document.getElementById(
            "update-marker"
        );

    const deleteMarkerButton =
        document.getElementById(
            "delete-marker"
        );

    const manageMarkersButton =
        document.getElementById(
            "manage-markers"
        );

    const trailCameraMenu =
        document.getElementById(
            "trail-camera-menu"
        );

    const standsMenu =
        document.getElementById(
            "stands-menu"
        );

    const huntHistoryMenu =
        document.getElementById(
            "hunt-history-menu"
        );

    const markerCount =
        document.getElementById(
            "marker-count"
        );

    const huntCount =
        document.getElementById(
            "hunt-count"
        );

    const huntDetailsModal =
        document.getElementById(
            "hunt-details-modal"
        );

    const closeHuntDetails =
        document.getElementById(
            "close-hunt-details"
        );

    const huntDetailDate =
        document.getElementById(
            "hunt-detail-date"
        );

    const huntDetailDuration =
        document.getElementById(
            "hunt-detail-duration"
        );

    const huntDetailDistance =
        document.getElementById(
            "hunt-detail-distance"
        );

    const showHuntRouteButton =
        document.getElementById(
            "show-hunt-route"
        );

    const deleteHuntButton =
        document.getElementById(
            "delete-hunt"
        );

    const refreshWeatherButton =
        document.getElementById(
            "refresh-weather"
        );

    const toast =
        document.getElementById("toast");


    /* =====================================================
       UTILITIES
    ===================================================== */

    function showToast(message) {

        if (!toast) return;

        toast.textContent = message;

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer =
            setTimeout(function () {
                toast.classList.remove("show");
            }, 2600);
    }


    function generateId(prefix) {

        return (
            prefix +
            "-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );
    }


    function escapeHtml(value) {

        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function formatNumber(value, digits) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "--";
        }

        return number.toFixed(digits);
    }


    function getMarkers() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        MARKER_STORAGE
                    ) || "[]"
                );

            return Array.isArray(saved)
                ? saved
                : [];

        } catch (error) {

            console.error(error);

            return [];
        }
    }


    function saveMarkers(markers) {

        localStorage.setItem(
            MARKER_STORAGE,
            JSON.stringify(markers)
        );

        updateCounts();
    }


    function getHunts() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        HUNT_STORAGE
                    ) || "[]"
                );

            return Array.isArray(saved)
                ? saved
                : [];

        } catch (error) {

            console.error(error);

            return [];
        }
    }


    function saveHunts(hunts) {

        localStorage.setItem(
            HUNT_STORAGE,
            JSON.stringify(hunts)
        );

        updateCounts();
    }


    function updateCounts() {

        const markers = getMarkers();
        const hunts = getHunts();

        if (markerCount) {

            markerCount.textContent =
                markers.length +
                (
                    markers.length === 1
                        ? " saved marker"
                        : " saved markers"
                );
        }

        if (huntCount) {

            huntCount.textContent =
                hunts.length +
                (
                    hunts.length === 1
                        ? " completed hunt"
                        : " completed hunts"
                );
        }
    }


    /* =====================================================
       PAGE NAVIGATION
    ===================================================== */

    function switchPage(pageId) {

        pages.forEach(function (page) {
            page.classList.remove("active");
        });

        navButtons.forEach(function (button) {
            button.classList.remove("active");
        });

        const target =
            document.getElementById(pageId);

        if (target) {
            target.classList.add("active");
        }

        const nav =
            document.querySelector(
                '.nav-button[data-page="' +
                pageId +
                '"]'
            );

        if (nav) {
            nav.classList.add("active");
        }

        if (
            pageId === "map-page" &&
            map
        ) {

            setTimeout(function () {
                map.invalidateSize();
            }, 100);
        }

        if (pageId === "hunt-page") {
            displayHuntHistory();
        }

        if (pageId === "more-page") {
            updateCounts();
        }

        if (
            pageId === "weather-page" &&
            !weatherData &&
            currentLatitude !== null
        ) {

            loadWeather();
        }
    }


    navButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const pageId =
                    button.dataset.page;

                if (pageId) {
                    switchPage(pageId);
                }
            }
        );
    });


    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            function () {

                switchPage("more-page");
            }
        );
    }


    /* =====================================================
       MAP INITIALIZATION
    ===================================================== */

    function initializeMap() {

        const mapElement =
            document.getElementById(
                "leaflet-map"
            );

        if (!mapElement) {

            console.error(
                "StandPoint: map container missing."
            );

            return;
        }

        if (typeof L === "undefined") {

            console.error(
                "StandPoint: Leaflet failed to load."
            );

            return;
        }

        map = L.map(
            "leaflet-map",
            {
                zoomControl: true,
                preferCanvas: true
            }
        );

        map.setView(
            [38.5, -92.5],
            8
        );


        streetLayer =
            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    maxZoom: 19,
                    attribution:
                        "&copy; OpenStreetMap contributors"
                }
            );


        satelliteLayer =
            L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                {
                    maxZoom: 19,
                    attribution:
                        "Tiles &copy; Esri"
                }
            );


        satelliteLayer.addTo(map);

        currentMapLayer = "satellite";


        map.on(
            "contextmenu",
            function (event) {

                prepareMarkerLocation(
                    event.latlng.lat,
                    event.latlng.lng,
                    "map"
                );
            }
        );


        let pressTimer = null;
        let pressStart = null;


        map.on(
            "mousedown touchstart",
            function (event) {

                const point =
                    event.latlng;

                pressStart = point;

                clearTimeout(pressTimer);

                pressTimer =
                    setTimeout(function () {

                        if (!pressStart) return;

                        prepareMarkerLocation(
                            pressStart.lat,
                            pressStart.lng,
                            "map"
                        );

                        pressStart = null;

                    }, 650);
            }
        );


        map.on(
            "mouseup touchend dragstart zoomstart",
            function () {

                clearTimeout(pressTimer);

                pressStart = null;
            }
        );


        loadSavedMarkers();


        setTimeout(function () {

            if (mapTip) {

                mapTip.classList.add("show");

                setTimeout(function () {

                    mapTip.classList.remove(
                        "show"
                    );

                }, 4500);
            }

        }, 2200);


        console.log(
            "StandPoint map initialized."
        );
    }


    /* =====================================================
       MAP LAYERS
    ===================================================== */

    if (layersButton) {

        layersButton.addEventListener(
            "click",
            function () {

                if (!map) return;


                if (
                    currentMapLayer ===
                    "satellite"
                ) {

                    if (
                        satelliteLayer &&
                        map.hasLayer(
                            satelliteLayer
                        )
                    ) {

                        map.removeLayer(
                            satelliteLayer
                        );
                    }

                    streetLayer.addTo(map);

                    currentMapLayer =
                        "street";

                    layersButton.title =
                        "Switch to Satellite";

                    showToast(
                        "Street map enabled"
                    );

                } else {

                    if (
                        streetLayer &&
                        map.hasLayer(
                            streetLayer
                        )
                    ) {

                        map.removeLayer(
                            streetLayer
                        );
                    }

                    satelliteLayer.addTo(map);

                    currentMapLayer =
                        "satellite";

                    layersButton.title =
                        "Switch to Street Map";

                    showToast(
                        "Satellite map enabled"
                    );
                }
            }
        );
    }


    /* =====================================================
       MARKER DEFINITIONS
    ===================================================== */

    const markerDefinitions = {

        camera: {
            icon: "📷",
            name: "Trail Camera"
        },

        stand: {
            icon: "🌲",
            name: "Tree Stand"
        },

        blind: {
            icon: "⛺",
            name: "Ground Blind"
        },

        deer: {
            icon: "🦌",
            name: "Deer Sighting"
        },

        bedding: {
            icon: "🌾",
            name: "Bedding Area"
        },

        scrape: {
            icon: "🐾",
            name: "Scrape"
        },

        rub: {
            icon: "🌳",
            name: "Rub"
        },

        food: {
            icon: "🌽",
            name: "Food Source"
        },

        water: {
            icon: "💧",
            name: "Water"
        },

        parking: {
            icon: "🚙",
            name: "Parking"
        },

        hazard: {
            icon: "⚠️",
            name: "Hazard"
        },

        custom: {
            icon: "📍",
            name: "Custom"
        }
    };


    function markerDefinition(type) {

        return (
            markerDefinitions[type] ||
            markerDefinitions.custom
        );
    }


    function createMarkerIcon(type) {

        const definition =
            markerDefinition(type);

        return L.divIcon({

            className: "",

            html:
                '<div class="standpoint-marker">' +
                definition.icon +
                "</div>",

            iconSize: [38, 38],

            iconAnchor: [19, 19],

            popupAnchor: [0, -18]
        });
    }


    /* =====================================================
       DISPLAY SAVED MARKERS
    ===================================================== */

    function displayMarker(marker) {

        if (!map) return;

        const latitude =
            Number(marker.latitude);

        const longitude =
            Number(marker.longitude);

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {
            return;
        }

        if (leafletMarkers[marker.id]) {

            map.removeLayer(
                leafletMarkers[marker.id]
            );
        }

        const definition =
            markerDefinition(marker.type);

        const leafletMarker =
            L.marker(
                [latitude, longitude],
                {
                    icon:
                        createMarkerIcon(
                            marker.type
                        )
                }
            );

        leafletMarker.addTo(map);

        leafletMarker.bindPopup(
            buildMarkerPopup(marker)
        );

        leafletMarkers[marker.id] =
            leafletMarker;
    }


    function buildMarkerPopup(marker) {

        const definition =
            markerDefinition(marker.type);

        const title =
            marker.name ||
            definition.name;

        const notes =
            marker.notes
                ? (
                    '<div class="popup-marker-notes">' +
                    escapeHtml(marker.notes) +
                    "</div>"
                )
                : "";

        return (
            '<div class="popup-marker-type">' +
            escapeHtml(definition.name) +
            "</div>" +

            '<div class="popup-marker-title">' +
            escapeHtml(title) +
            "</div>" +

            notes +

            '<button class="popup-edit-button" ' +
            'data-edit-marker="' +
            escapeHtml(marker.id) +
            '">' +
            "EDIT MARKER" +
            "</button>"
        );
    }


    function loadSavedMarkers() {

        if (!map) return;

        Object.values(
            leafletMarkers
        ).forEach(function (leafletMarker) {

            if (
                map.hasLayer(
                    leafletMarker
                )
            ) {

                map.removeLayer(
                    leafletMarker
                );
            }
        });

        leafletMarkers = {};

        getMarkers().forEach(
            displayMarker
        );

        updateCounts();
    }


    /* =====================================================
       MAP MARKER PLACEMENT
    ===================================================== */

    function prepareMarkerLocation(
        latitude,
        longitude,
        source
    ) {

        if (!map) return;

        pendingMarkerLocation = {
            latitude:
                Number(latitude),
            longitude:
                Number(longitude),
            source:
                source
        };


        if (mapSelectionMarker) {

            map.removeLayer(
                mapSelectionMarker
            );
        }


        const selectionIcon =
            L.divIcon({

                className: "",

                html:
                    '<div class="map-selected-location"></div>',

                iconSize:
                    [24, 24],

                iconAnchor:
                    [12, 12]
            });


        mapSelectionMarker =
            L.marker(
                [
                    pendingMarkerLocation.latitude,
                    pendingMarkerLocation.longitude
                ],
                {
                    icon:
                        selectionIcon,
                    interactive:
                        false
                }
            )
            .addTo(map);


        if (markerModalDescription) {

            markerModalDescription.textContent =
                source === "gps"
                    ? "Choose a marker for your GPS location"
                    : "Choose a marker for this map location";
        }


        openModal(markerModal);
    }


    if (addMarkerButton) {

        addMarkerButton.addEventListener(
            "click",
            function () {

                if (
                    currentLatitude === null ||
                    currentLongitude === null
                ) {

                    showToast(
                        "Waiting for your GPS location"
                    );

                    requestLocation(true);

                    return;
                }

                prepareMarkerLocation(
                    currentLatitude,
                    currentLongitude,
                    "gps"
                );
            }
        );
    }


    markerButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    if (
                        !pendingMarkerLocation
                    ) {

                        if (
                            currentLatitude === null ||
                            currentLongitude === null
                        ) {

                            closeModal(
                                markerModal
                            );

                            showToast(
                                "Choose a map location first"
                            );

                            return;
                        }

                        pendingMarkerLocation = {
                            latitude:
                                currentLatitude,
                            longitude:
                                currentLongitude,
                            source:
                                "gps"
                        };
                    }


                    pendingMarkerType =
                        button.dataset.marker;


                    const definition =
                        markerDefinition(
                            pendingMarkerType
                        );


                    if (markerDetailsTitle) {

                        markerDetailsTitle.textContent =
                            definition.icon +
                            " " +
                            definition.name;
                    }


                    if (markerName) {
                        markerName.value = "";
                    }

                    if (markerNotes) {
                        markerNotes.value = "";
                    }


                    if (
                        markerCoordinatePreview
                    ) {

                        markerCoordinatePreview.textContent =
                            "Location: " +
                            pendingMarkerLocation.latitude
                                .toFixed(6) +
                            ", " +
                            pendingMarkerLocation.longitude
                                .toFixed(6);
                    }


                    closeModal(markerModal);

                    openModal(
                        markerDetailsModal
                    );


                    setTimeout(function () {

                        if (markerName) {
                            markerName.focus();
                        }

                    }, 250);
                }
            );
        }
    );


    if (saveMarkerDetails) {

        saveMarkerDetails.addEventListener(
            "click",
            function () {

                if (
                    !pendingMarkerLocation ||
                    !pendingMarkerType
                ) {

                    showToast(
                        "Marker location is missing"
                    );

                    return;
                }


                const definition =
                    markerDefinition(
                        pendingMarkerType
                    );


                const marker = {

                    id:
                        generateId(
                            "marker"
                        ),

                    type:
                        pendingMarkerType,

                    name:
                        markerName &&
                        markerName.value.trim()
                            ? markerName.value.trim()
                            : definition.name,

                    notes:
                        markerNotes
                            ? markerNotes.value.trim()
                            : "",

                    latitude:
                        pendingMarkerLocation.latitude,

                    longitude:
                        pendingMarkerLocation.longitude,

                    createdAt:
                        new Date().toISOString()
                };


                const markers =
                    getMarkers();

                markers.push(marker);

                saveMarkers(markers);

                displayMarker(marker);


                closeModal(
                    markerDetailsModal
                );


                if (mapSelectionMarker) {

                    map.removeLayer(
                        mapSelectionMarker
                    );

                    mapSelectionMarker =
                        null;
                }


                pendingMarkerLocation =
                    null;

                pendingMarkerType =
                    null;


                map.setView(
                    [
                        marker.latitude,
                        marker.longitude
                    ],
                    Math.max(
                        map.getZoom(),
                        17
                    )
                );


                showToast(
                    definition.name +
                    " saved"
                );
            }
        );
    }


    /* =====================================================
       MARKER EDITING
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const editButton =
                event.target.closest(
                    "[data-edit-marker]"
                );

            if (!editButton) return;

            const id =
                editButton.getAttribute(
                    "data-edit-marker"
                );

            openMarkerEditor(id);
        }
    );


    function openMarkerEditor(id) {

        const marker =
            getMarkers().find(
                function (item) {
                    return item.id === id;
                }
            );

        if (!marker) return;

        selectedMarkerId = id;

        const definition =
            markerDefinition(marker.type);

        if (editMarkerType) {

            editMarkerType.textContent =
                definition.icon +
                " " +
                definition.name;
        }

        if (editMarkerName) {

            editMarkerName.value =
                marker.name || "";
        }

        if (editMarkerNotes) {

            editMarkerNotes.value =
                marker.notes || "";
        }

        if (
            map &&
            leafletMarkers[id]
        ) {

            leafletMarkers[id]
                .closePopup();
        }

        closeModal(
            savedMarkersModal
        );

        openModal(
            editMarkerModal
        );
    }


    if (updateMarkerButton) {

        updateMarkerButton.addEventListener(
            "click",
            function () {

                if (!selectedMarkerId) {
                    return;
                }

                const markers =
                    getMarkers();

                const index =
                    markers.findIndex(
                        function (item) {

                            return (
                                item.id ===
                                selectedMarkerId
                            );
                        }
                    );

                if (index === -1) {
                    return;
                }


                const definition =
                    markerDefinition(
                        markers[index].type
                    );


                markers[index].name =
                    editMarkerName &&
                    editMarkerName.value.trim()
                        ? editMarkerName.value.trim()
                        : definition.name;


                markers[index].notes =
                    editMarkerNotes
                        ? editMarkerNotes.value.trim()
                        : "";


                markers[index].updatedAt =
                    new Date().toISOString();


                saveMarkers(markers);

                displayMarker(
                    markers[index]
                );


                closeModal(
                    editMarkerModal
                );

                selectedMarkerId = null;

                renderSavedMarkerList();

                showToast(
                    "Marker updated"
                );
            }
        );
    }


    if (deleteMarkerButton) {

        deleteMarkerButton.addEventListener(
            "click",
            function () {

                if (!selectedMarkerId) {
                    return;
                }


                const marker =
                    getMarkers().find(
                        function (item) {

                            return (
                                item.id ===
                                selectedMarkerId
                            );
                        }
                    );


                if (!marker) return;


                const confirmed =
                    window.confirm(
                        "Delete " +
                        (
                            marker.name ||
                            "this marker"
                        ) +
                        "?"
                    );


                if (!confirmed) return;


                const markers =
                    getMarkers().filter(
                        function (item) {

                            return (
                                item.id !==
                                selectedMarkerId
                            );
                        }
                    );


                if (
                    leafletMarkers[
                        selectedMarkerId
                    ]
                ) {

                    map.removeLayer(
                        leafletMarkers[
                            selectedMarkerId
                        ]
                    );

                    delete leafletMarkers[
                        selectedMarkerId
                    ];
                }


                saveMarkers(markers);

                closeModal(
                    editMarkerModal
                );

                selectedMarkerId = null;

                renderSavedMarkerList();

                showToast(
                    "Marker deleted"
                );
            }
        );
    }


    /* =====================================================
       SAVED MARKER LIST
    ===================================================== */

    function renderSavedMarkerList(
        filterTypes
    ) {

        if (!savedMarkerList) return;


        let markers =
            getMarkers();


        if (
            Array.isArray(filterTypes)
        ) {

            markers =
                markers.filter(
                    function (marker) {

                        return filterTypes.includes(
                            marker.type
                        );
                    }
                );
        }


        markers.sort(
            function (a, b) {

                return (
                    new Date(
                        b.createdAt || 0
                    ) -
                    new Date(
                        a.createdAt || 0
                    )
                );
            }
        );


        if (!markers.length) {

            savedMarkerList.innerHTML =
                '<div class="empty-state">' +
                "<span>📍</span>" +
                "<p>No matching markers saved.</p>" +
                "</div>";

            return;
        }


        savedMarkerList.innerHTML =
            markers.map(
                function (marker) {

                    const definition =
                        markerDefinition(
                            marker.type
                        );

                    return (
                        '<div class="saved-marker-item" ' +
                        'data-saved-marker="' +
                        escapeHtml(marker.id) +
                        '">' +

                        '<div class="saved-marker-icon">' +
                        definition.icon +
                        "</div>" +

                        '<div class="saved-marker-main">' +

                        "<strong>" +
                        escapeHtml(
                            marker.name ||
                            definition.name
                        ) +
                        "</strong>" +

                        "<small>" +
                        escapeHtml(
                            definition.name
                        ) +
                        "</small>" +

                        "</div>" +

                        '<div class="saved-marker-arrow">›</div>' +

                        "</div>"
                    );
                }
            )
            .join("");
    }


    if (savedMarkerList) {

        savedMarkerList.addEventListener(
            "click",
            function (event) {

                const row =
                    event.target.closest(
                        "[data-saved-marker]"
                    );

                if (!row) return;


                const id =
                    row.getAttribute(
                        "data-saved-marker"
                    );


                const marker =
                    getMarkers().find(
                        function (item) {

                            return (
                                item.id === id
                            );
                        }
                    );


                if (!marker) return;


                closeModal(
                    savedMarkersModal
                );


                switchPage(
                    "map-page"
                );


                setTimeout(function () {

                    map.setView(
                        [
                            marker.latitude,
                            marker.longitude
                        ],
                        18
                    );

                    if (
                        leafletMarkers[id]
                    ) {

                        leafletMarkers[id]
                            .openPopup();
                    }

                }, 150);
            }
        );
    }


    if (manageMarkersButton) {

        manageMarkersButton.addEventListener(
            "click",
            function () {

                renderSavedMarkerList();

                openModal(
                    savedMarkersModal
                );
            }
        );
    }


    if (trailCameraMenu) {

        trailCameraMenu.addEventListener(
            "click",
            function () {

                renderSavedMarkerList(
                    ["camera"]
                );

                openModal(
                    savedMarkersModal
                );
            }
        );
    }


    if (standsMenu) {

        standsMenu.addEventListener(
            "click",
            function () {

                renderSavedMarkerList(
                    ["stand", "blind"]
                );

                openModal(
                    savedMarkersModal
                );
            }
        );
    }


    /* =====================================================
       GPS
    ===================================================== */

    function requestLocation(
        centerAfter
    ) {

        if (
            !navigator.geolocation
        ) {

            showToast(
                "GPS is not supported on this device"
            );

            return;
        }


        navigator.geolocation
            .getCurrentPosition(

                function (position) {

                    handlePosition(
                        position,
                        centerAfter
                    );

                    startLocationWatch();
                },

                function (error) {

                    handleLocationError(
                        error
                    );
                },

                {
                    enableHighAccuracy: true,
                    timeout: 12000,
                    maximumAge: 5000
                }
            );
    }


    function startLocationWatch() {

        if (
            !navigator.geolocation ||
            locationWatchId !== null
        ) {
            return;
        }


        locationWatchId =
            navigator.geolocation
                .watchPosition(

                    function (position) {

                        handlePosition(
                            position,
                            false
                        );
                    },

                    function (error) {

                        console.warn(
                            "StandPoint GPS:",
                            error.message
                        );
                    },

                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 3000
                    }
                );
    }


    function handlePosition(
        position,
        centerAfter
    ) {

        const latitude =
            position.coords.latitude;

        const longitude =
            position.coords.longitude;

        const accuracy =
            position.coords.accuracy;


        currentLatitude =
            latitude;

        currentLongitude =
            longitude;

        currentAccuracy =
            accuracy;


        updateCurrentLocationMarker(
            latitude,
            longitude,
            accuracy
        );


        if (
            centerAfter &&
            map
        ) {

            map.setView(
                [latitude, longitude],
                17
            );
        }


        const locationText =
            document.getElementById(
                "location-text"
            );

        if (locationText) {

            locationText.textContent =
                "GPS ±" +
                Math.round(accuracy) +
                " m";
        }


        if (huntGpsStatus) {

            huntGpsStatus.textContent =
                "GPS accuracy ±" +
                Math.round(accuracy) +
                " m";
        }


        if (huntActive) {

            recordHuntPosition(
                latitude,
                longitude,
                accuracy,
                position.coords.speed
            );
        }


        if (!weatherData) {
            loadWeather();
        }
    }


    function handleLocationError(
        error
    ) {

        console.warn(
            "StandPoint GPS error:",
            error
        );


        let message =
            "Unable to get GPS location";


        if (error.code === 1) {

            message =
                "Location permission was denied";
        }

        if (error.code === 2) {

            message =
                "GPS location is unavailable";
        }

        if (error.code === 3) {

            message =
                "GPS request timed out";
        }


        if (huntGpsStatus) {

            huntGpsStatus.textContent =
                message;
        }


        showToast(message);
    }


    function updateCurrentLocationMarker(
        latitude,
        longitude,
        accuracy
    ) {

        if (!map) return;


        const currentIcon =
            L.divIcon({

                className: "",

                html:
                    '<div class="current-location-marker"></div>',

                iconSize:
                    [20, 20],

                iconAnchor:
                    [10, 10]
            });


        if (!currentLocationMarker) {

            currentLocationMarker =
                L.marker(
                    [
                        latitude,
                        longitude
                    ],
                    {
                        icon:
                            currentIcon,
                        zIndexOffset:
                            1000
                    }
                )
                .addTo(map);

        } else {

            currentLocationMarker
                .setLatLng(
                    [
                        latitude,
                        longitude
                    ]
                );
        }


        if (!accuracyCircle) {

            accuracyCircle =
                L.circle(
                    [
                        latitude,
                        longitude
                    ],
                    {
                        radius:
                            accuracy,
                        weight:
                            1,
                        opacity:
                            0.45,
                        fillOpacity:
                            0.08
                    }
                )
                .addTo(map);

        } else {

            accuracyCircle
                .setLatLng(
                    [
                        latitude,
                        longitude
                    ]
                );

            accuracyCircle
                .setRadius(
                    accuracy
                );
        }
    }


    if (centerGpsButton) {

        centerGpsButton.addEventListener(
            "click",
            function () {

                if (
                    currentLatitude !== null &&
                    currentLongitude !== null
                ) {

                    map.setView(
                        [
                            currentLatitude,
                            currentLongitude
                        ],
                        18
                    );

                    showToast(
                        "Centered on your location"
                    );

                } else {

                    showToast(
                        "Getting your GPS location..."
                    );

                    requestLocation(true);
                }
            }
        );
    }


    /* =====================================================
       DISTANCE
    ===================================================== */

    function haversineMiles(
        lat1,
        lon1,
        lat2,
        lon2
    ) {

        const earthRadiusMiles =
            3958.7613;

        const toRadians =
            function (degrees) {

                return (
                    degrees *
                    Math.PI /
                    180
                );
            };


        const deltaLat =
            toRadians(
                lat2 - lat1
            );

        const deltaLon =
            toRadians(
                lon2 - lon1
            );


        const a =
            Math.sin(
                deltaLat / 2
            ) ** 2 +

            Math.cos(
                toRadians(lat1)
            ) *

            Math.cos(
                toRadians(lat2)
            ) *

            Math.sin(
                deltaLon / 2
            ) ** 2;


        const c =
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );


        return (
            earthRadiusMiles * c
        );
    }


    /* =====================================================
       HUNT TRACKING
    ===================================================== */

    function toggleHunt() {

        if (huntActive) {

            stopHunt();

        } else {

            startHunt();
        }
    }


    function startHunt() {

        if (
            currentLatitude === null ||
            currentLongitude === null
        ) {

            showToast(
                "Getting GPS before starting hunt..."
            );

            requestLocation(true);

            return;
        }


        huntActive = true;

        huntStartTime =
            Date.now();

        huntPath = [];

        huntDistanceMiles = 0;


        if (
            displayedHistoryRoute &&
            map
        ) {

            map.removeLayer(
                displayedHistoryRoute
            );

            displayedHistoryRoute =
                null;
        }


        if (
            huntRouteLine &&
            map.hasLayer(
                huntRouteLine
            )
        ) {

            map.removeLayer(
                huntRouteLine
            );
        }


        huntRouteLine =
            L.polyline(
                [],
                {
                    weight: 5,
                    opacity: 0.9
                }
            )
            .addTo(map);


        recordHuntPosition(
            currentLatitude,
            currentLongitude,
            currentAccuracy || 0,
            null
        );


        huntTimerInterval =
            setInterval(
                updateHuntTimer,
                1000
            );


        updateHuntUI();

        showToast(
            "Hunt started"
        );
    }


    function stopHunt() {

        if (!huntActive) return;


        const endTime =
            Date.now();

        const durationSeconds =
            Math.max(
                0,
                Math.floor(
                    (
                        endTime -
                        huntStartTime
                    ) /
                    1000
                )
            );


        const hunt = {

            id:
                generateId("hunt"),

            startedAt:
                new Date(
                    huntStartTime
                ).toISOString(),

            endedAt:
                new Date(
                    endTime
                ).toISOString(),

            durationSeconds:
                durationSeconds,

            distanceMiles:
                huntDistanceMiles,

            path:
                huntPath
        };


        const hunts =
            getHunts();

        hunts.unshift(hunt);

        saveHunts(hunts);


        huntActive = false;


        clearInterval(
            huntTimerInterval
        );

        huntTimerInterval =
            null;


        updateHuntUI();

        displayHuntHistory();


        showToast(
            "Hunt saved"
        );
    }


    function recordHuntPosition(
        latitude,
        longitude,
        accuracy,
        speed
    ) {

        if (!huntActive) return;


        /*
         * Ignore very inaccurate points.
         * Phone GPS can jump around under heavy tree cover.
         */

        if (
            Number.isFinite(accuracy) &&
            accuracy > 65
        ) {

            return;
        }


        const point = {

            latitude:
                latitude,

            longitude:
                longitude,

            accuracy:
                accuracy || null,

            speed:
                Number.isFinite(speed)
                    ? speed
                    : null,

            timestamp:
                Date.now()
        };


        const previous =
            huntPath.length
                ? huntPath[
                    huntPath.length - 1
                ]
                : null;


        if (previous) {

            const segment =
                haversineMiles(
                    previous.latitude,
                    previous.longitude,
                    latitude,
                    longitude
                );


            /*
             * Ignore tiny GPS jitter.
             * About 8 feet.
             */

            if (segment < 0.0015) {
                return;
            }


            /*
             * Ignore impossible GPS jumps.
             */

            const elapsedHours =
                Math.max(
                    (
                        point.timestamp -
                        previous.timestamp
                    ) /
                    3600000,
                    0.000001
                );


            const impliedMph =
                segment /
                elapsedHours;


            if (impliedMph > 45) {
                return;
            }


            huntDistanceMiles +=
                segment;
        }


        huntPath.push(point);


        if (huntRouteLine) {

            huntRouteLine.addLatLng(
                [
                    latitude,
                    longitude
                ]
            );
        }


        if (huntDistance) {

            huntDistance.textContent =
                huntDistanceMiles
                    .toFixed(2) +
                " mi";
        }
    }


    function updateHuntTimer() {

        if (
            !huntActive ||
            !huntStartTime
        ) {
            return;
        }


        const elapsedSeconds =
            Math.floor(
                (
                    Date.now() -
                    huntStartTime
                ) /
                1000
            );


        if (huntTime) {

            huntTime.textContent =
                formatDuration(
                    elapsedSeconds
                );
        }
    }


    function formatDuration(
        totalSeconds
    ) {

        const seconds =
            Math.max(
                0,
                Math.floor(
                    Number(
                        totalSeconds
                    ) || 0
                )
            );


        const hours =
            Math.floor(
                seconds / 3600
            );

        const minutes =
            Math.floor(
                (
                    seconds % 3600
                ) /
                60
            );

        const remainingSeconds =
            seconds % 60;


        return (
            String(hours)
                .padStart(2, "0") +
            ":" +
            String(minutes)
                .padStart(2, "0") +
            ":" +
            String(
                remainingSeconds
            ).padStart(2, "0")
        );
    }


    function updateHuntUI() {

        if (huntActive) {

            if (huntStatus) {
                huntStatus.textContent =
                    "Hunt In Progress";
            }

            if (startHuntButton) {

                startHuntButton.textContent =
                    "■ STOP HUNT";

                startHuntButton
                    .classList
                    .add("active");
            }

            if (huntPageStartButton) {

                huntPageStartButton.textContent =
                    "STOP & SAVE HUNT";
            }

        } else {

            if (huntStatus) {
                huntStatus.textContent =
                    "No Active Hunt";
            }

            if (startHuntButton) {

                startHuntButton.textContent =
                    "▶ START HUNT";

                startHuntButton
                    .classList
                    .remove("active");
            }

            if (huntPageStartButton) {

                huntPageStartButton.textContent =
                    "START HUNT";
            }
        }
    }


    if (startHuntButton) {

        startHuntButton.addEventListener(
            "click",
            toggleHunt
        );
    }


    if (huntPageStartButton) {

        huntPageStartButton.addEventListener(
            "click",
            toggleHunt
        );
    }


    /* =====================================================
       HUNT HISTORY
    ===================================================== */

    function displayHuntHistory() {

        if (!huntHistory) return;


        const hunts =
            getHunts();


        if (!hunts.length) {

            huntHistory.innerHTML =
                '<div class="empty-state">' +
                "<span>🥾</span>" +
                "<p>Your completed hunts will appear here.</p>" +
                "</div>";

            updateCounts();

            return;
        }


        huntHistory.innerHTML =
            hunts
                .slice(0, 20)
                .map(
                    function (hunt) {

                        const date =
                            new Date(
                                hunt.startedAt
                            );


                        return (
                            '<div class="hunt-history-item" ' +
                            'data-hunt-id="' +
                            escapeHtml(
                                hunt.id
                            ) +
                            '">' +

                            '<div class="history-icon">🥾</div>' +

                            '<div class="history-main">' +

                            "<strong>" +
                            escapeHtml(
                                date.toLocaleDateString(
                                    [],
                                    {
                                        month:
                                            "short",
                                        day:
                                            "numeric",
                                        year:
                                            "numeric"
                                    }
                                )
                            ) +
                            "</strong>" +

                            "<small>" +
                            escapeHtml(
                                date.toLocaleTimeString(
                                    [],
                                    {
                                        hour:
                                            "numeric",
                                        minute:
                                            "2-digit"
                                    }
                                )
                            ) +
                            " • " +
                            formatDuration(
                                hunt.durationSeconds
                            ) +
                            " • " +
                            Number(
                                hunt.distanceMiles || 0
                            ).toFixed(2) +
                            " mi" +
                            "</small>" +

                            "</div>" +

                            '<div class="history-arrow">›</div>' +

                            "</div>"
                        );
                    }
                )
                .join("");


        updateCounts();
    }


    if (huntHistory) {

        huntHistory.addEventListener(
            "click",
            function (event) {

                const row =
                    event.target.closest(
                        "[data-hunt-id]"
                    );

                if (!row) return;

                openHuntDetails(
                    row.getAttribute(
                        "data-hunt-id"
                    )
                );
            }
        );
    }


    function openHuntDetails(id) {

        const hunt =
            getHunts().find(
                function (item) {

                    return item.id === id;
                }
            );

        if (!hunt) return;


        selectedHuntId = id;


        const date =
            new Date(
                hunt.startedAt
            );


        if (huntDetailDate) {

            huntDetailDate.textContent =
                date.toLocaleString();
        }


        if (huntDetailDuration) {

            huntDetailDuration.textContent =
                formatDuration(
                    hunt.durationSeconds
                );
        }


        if (huntDetailDistance) {

            huntDetailDistance.textContent =
                Number(
                    hunt.distanceMiles || 0
                ).toFixed(2) +
                " mi";
        }


        if (showHuntRouteButton) {

            showHuntRouteButton.disabled =
                !Array.isArray(
                    hunt.path
                ) ||
                hunt.path.length < 2;

            showHuntRouteButton.textContent =
                showHuntRouteButton.disabled
                    ? "NO ROUTE RECORDED"
                    : "SHOW ROUTE ON MAP";
        }


        openModal(
            huntDetailsModal
        );
    }


    if (showHuntRouteButton) {

        showHuntRouteButton.addEventListener(
            "click",
            function () {

                if (!selectedHuntId) {
                    return;
                }


                const hunt =
                    getHunts().find(
                        function (item) {

                            return (
                                item.id ===
                                selectedHuntId
                            );
                        }
                    );


                if (
                    !hunt ||
                    !Array.isArray(
                        hunt.path
                    ) ||
                    hunt.path.length < 2
                ) {

                    showToast(
                        "No route was recorded for this hunt"
                    );

                    return;
                }


                closeModal(
                    huntDetailsModal
                );


                switchPage(
                    "map-page"
                );


                setTimeout(function () {

                    if (
                        displayedHistoryRoute
                    ) {

                        map.removeLayer(
                            displayedHistoryRoute
                        );
                    }


                    const points =
                        hunt.path.map(
                            function (point) {

                                return [
                                    point.latitude,
                                    point.longitude
                                ];
                            }
                        );


                    displayedHistoryRoute =
                        L.polyline(
                            points,
                            {
                                weight: 5,
                                opacity: 0.9,
                                dashArray:
                                    "8 6"
                            }
                        )
                        .addTo(map);


                    map.fitBounds(
                        displayedHistoryRoute
                            .getBounds(),
                        {
                            padding:
                                [40, 40]
                        }
                    );


                    showToast(
                        "Showing saved hunt route"
                    );

                }, 160);
            }
        );
    }


    if (deleteHuntButton) {

        deleteHuntButton.addEventListener(
            "click",
            function () {

                if (!selectedHuntId) {
                    return;
                }


                const confirmed =
                    window.confirm(
                        "Delete this saved hunt?"
                    );


                if (!confirmed) {
                    return;
                }


                const hunts =
                    getHunts().filter(
                        function (hunt) {

                            return (
                                hunt.id !==
                                selectedHuntId
                            );
                        }
                    );


                saveHunts(hunts);

                selectedHuntId =
                    null;


                closeModal(
                    huntDetailsModal
                );


                displayHuntHistory();


                showToast(
                    "Hunt deleted"
                );
            }
        );
    }


    if (huntHistoryMenu) {

        huntHistoryMenu.addEventListener(
            "click",
            function () {

                switchPage(
                    "hunt-page"
                );
            }
        );
    }


    /* =====================================================
       COMPASS
    ===================================================== */

    function startCompass() {

        if (
            typeof DeviceOrientationEvent ===
            "undefined"
        ) {

            return;
        }


        /*
         * Desktop browsers generally won't supply this.
         * iPhone may require permission from a user gesture.
         */

        window.addEventListener(
            "deviceorientation",
            handleOrientation,
            true
        );


        window.addEventListener(
            "deviceorientationabsolute",
            handleOrientation,
            true
        );
    }


    function handleOrientation(
        event
    ) {

        let heading = null;


        if (
            typeof event.webkitCompassHeading ===
            "number"
        ) {

            heading =
                event.webkitCompassHeading;

        } else if (
            typeof event.alpha ===
            "number"
        ) {

            heading =
                360 -
                event.alpha;
        }


        if (!Number.isFinite(heading)) {
            return;
        }


        heading =
            (
                heading +
                360
            ) %
            360;


        currentHeading =
            heading;


        const headingText =
            Math.round(heading) +
            "° " +
            compassDirection(
                heading
            );


        if (headingDisplay) {

            headingDisplay.textContent =
                headingText;
        }


        if (huntHeading) {

            huntHeading.textContent =
                headingText;
        }
    }


    function compassDirection(
        degrees
    ) {

        const directions = [
            "N",
            "NE",
            "E",
            "SE",
            "S",
            "SW",
            "W",
            "NW"
        ];


        return directions[
            Math.round(
                degrees / 45
            ) % 8
        ];
    }


    /* =====================================================
       WEATHER
       Open-Meteo does not require an API key.
    ===================================================== */

    async function loadWeather() {

        if (
            currentLatitude === null ||
            currentLongitude === null
        ) {

            setWeatherStatus(
                "Waiting for your location...",
                ""
            );

            return;
        }


        setWeatherStatus(
            "Loading current conditions...",
            ""
        );


        const latitude =
            currentLatitude.toFixed(5);

        const longitude =
            currentLongitude.toFixed(5);


        const url =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" +
            encodeURIComponent(latitude) +
            "&longitude=" +
            encodeURIComponent(longitude) +

            "&current=" +
            encodeURIComponent(
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "precipitation",
                    "weather_code",
                    "surface_pressure",
                    "wind_speed_10m",
                    "wind_direction_10m"
                ].join(",")
            ) +

            "&daily=" +
            encodeURIComponent(
                [
                    "sunrise",
                    "sunset"
                ].join(",")
            ) +

            "&temperature_unit=fahrenheit" +
            "&wind_speed_unit=mph" +
            "&precipitation_unit=inch" +
            "&timezone=auto" +
            "&forecast_days=1";


        try {

            const response =
                await fetch(url);


            if (!response.ok) {

                throw new Error(
                    "Weather service returned " +
                    response.status
                );
            }


            const data =
                await response.json();


            if (!data.current) {

                throw new Error(
                    "Weather data unavailable"
                );
            }


            weatherData =
                normalizeWeatherData(
                    data
                );


            updateWeatherUI();

            calculateDeerActivity();


            setWeatherStatus(
                "Updated " +
                new Date()
                    .toLocaleTimeString(
                        [],
                        {
                            hour:
                                "numeric",
                            minute:
                                "2-digit"
                        }
                    ),
                "success"
            );


        } catch (error) {

            console.error(
                "StandPoint weather:",
                error
            );


            setWeatherStatus(
                "Unable to load weather. Check your internet connection.",
                "error"
            );


            showToast(
                "Weather could not be loaded"
            );
        }
    }


    function normalizeWeatherData(
        data
    ) {

        const current =
            data.current || {};

        const daily =
            data.daily || {};


        return {

            temperature:
                Number(
                    current.temperature_2m
                ),

            humidity:
                Number(
                    current.relative_humidity_2m
                ),

            feelsLike:
                Number(
                    current.apparent_temperature
                ),

            precipitation:
                Number(
                    current.precipitation
                ),

            weatherCode:
                Number(
                    current.weather_code
                ),

            pressure:
                Number(
                    current.surface_pressure
                ),

            windSpeed:
                Number(
                    current.wind_speed_10m
                ),

            windDirection:
                Number(
                    current.wind_direction_10m
                ),

            sunrise:
                daily.sunrise &&
                daily.sunrise[0]
                    ? daily.sunrise[0]
                    : null,

            sunset:
                daily.sunset &&
                daily.sunset[0]
                    ? daily.sunset[0]
                    : null
        };
    }


    function setWeatherStatus(
        message,
        statusClass
    ) {

        const element =
            document.getElementById(
                "weather-status"
            );

        if (!element) return;


        element.textContent =
            message;


        element.classList.remove(
            "success",
            "error"
        );


        if (statusClass) {

            element.classList.add(
                statusClass
            );
        }
    }


    function updateWeatherUI() {

        if (!weatherData) return;


        setText(
            "temperature",
            Math.round(
                weatherData.temperature
            ) +
            "°F"
        );


        setText(
            "weather-wind",
            formatNumber(
                weatherData.windSpeed,
                1
            ) +
            " mph"
        );


        setText(
            "wind-direction",
            Number.isFinite(
                weatherData.windDirection
            )
                ? (
                    Math.round(
                        weatherData.windDirection
                    ) +
                    "° " +
                    compassDirection(
                        weatherData.windDirection
                    )
                )
                : "--"
        );


        setText(
            "pressure",
            Number.isFinite(
                weatherData.pressure
            )
                ? (
                    Math.round(
                        weatherData.pressure
                    ) +
                    " hPa"
                )
                : "--"
        );


        setText(
            "humidity",
            Number.isFinite(
                weatherData.humidity
            )
                ? (
                    Math.round(
                        weatherData.humidity
                    ) +
                    "%"
                )
                : "--"
        );


        setText(
            "feels-like",
            Number.isFinite(
                weatherData.feelsLike
            )
                ? (
                    Math.round(
                        weatherData.feelsLike
                    ) +
                    "°F"
                )
                : "--"
        );


        setText(
            "precipitation",
            Number.isFinite(
                weatherData.precipitation
            )
                ? (
                    weatherData.precipitation
                        .toFixed(2) +
                    " in"
                )
                : "--"
        );


        /*
         * Open-Meteo's selected current fields do not
         * include visibility here, so don't invent it.
         */

        setText(
            "visibility",
            "Not available"
        );


        setText(
            "sunrise",
            formatWeatherTime(
                weatherData.sunrise
            )
        );


        setText(
            "sunset",
            formatWeatherTime(
                weatherData.sunset
            )
        );


        const condition =
            weatherCodeInfo(
                weatherData.weatherCode
            );


        setText(
            "weather-description",
            condition.description
        );


        const weatherIcon =
            document.getElementById(
                "weather-icon"
            );

        if (weatherIcon) {

            weatherIcon.textContent =
                condition.icon;
        }


        if (windDisplay) {

            windDisplay.textContent =
                formatNumber(
                    weatherData.windSpeed,
                    0
                ) +
                " mph";
        }
    }


    function formatWeatherTime(
        value
    ) {

        if (!value) {
            return "--";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "--";
        }


        return date.toLocaleTimeString(
            [],
            {
                hour:
                    "numeric",
                minute:
                    "2-digit"
            }
        );
    }


    function weatherCodeInfo(
        code
    ) {

        if (code === 0) {
            return {
                icon: "☀️",
                description:
                    "Clear sky"
            };
        }

        if ([1, 2].includes(code)) {
            return {
                icon: "🌤️",
                description:
                    "Partly cloudy"
            };
        }

        if (code === 3) {
            return {
                icon: "☁️",
                description:
                    "Overcast"
            };
        }

        if ([45, 48].includes(code)) {
            return {
                icon: "🌫️",
                description:
                    "Fog"
            };
        }

        if (
            [
                51, 53, 55,
                56, 57
            ].includes(code)
        ) {

            return {
                icon: "🌦️",
                description:
                    "Drizzle"
            };
        }

        if (
            [
                61, 63, 65,
                66, 67,
                80, 81, 82
            ].includes(code)
        ) {

            return {
                icon: "🌧️",
                description:
                    "Rain"
            };
        }

        if (
            [
                71, 73, 75,
                77, 85, 86
            ].includes(code)
        ) {

            return {
                icon: "🌨️",
                description:
                    "Snow"
            };
        }

        if (
            [
                95, 96, 99
            ].includes(code)
        ) {

            return {
                icon: "⛈️",
                description:
                    "Thunderstorm"
            };
        }


        return {
            icon: "🌤️",
            description:
                "Current conditions"
        };
    }


    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent =
                value;
        }
    }


    if (refreshWeatherButton) {

        refreshWeatherButton.addEventListener(
            "click",
            function () {

                weatherData = null;

                loadWeather();
            }
        );
    }


    /* =====================================================
       DEER ACTIVITY ESTIMATE
    ===================================================== */

    function calculateDeerActivity() {

        if (!weatherData) {
            return;
        }


        /*
         * This is intentionally transparent.
         * It is a planning estimate, not a claim
         * that deer will move at a specific rate.
         */

        let score = 45;

        const reasons = [];


        const temperature =
            weatherData.temperature;

        const wind =
            weatherData.windSpeed;

        const pressure =
            weatherData.pressure;

        const precipitation =
            weatherData.precipitation;


        /* TEMPERATURE */

        if (
            temperature >= 35 &&
            temperature <= 60
        ) {

            score += 12;

            reasons.push({
                type: "positive",
                text:
                    "Cool temperatures are favorable in this estimate."
            });

        } else if (
            temperature >= 25 &&
            temperature < 35
        ) {

            score += 8;

            reasons.push({
                type: "positive",
                text:
                    "Cold conditions raise the activity estimate."
            });

        } else if (
            temperature > 75
        ) {

            score -= 8;

            reasons.push({
                type: "negative",
                text:
                    "Warm conditions lower the daytime estimate."
            });

        } else {

            score += 3;

            reasons.push({
                type: "neutral",
                text:
                    "Temperature has a moderate effect on the estimate."
            });
        }


        /* WIND */

        if (
            wind >= 3 &&
            wind <= 12
        ) {

            score += 10;

            reasons.push({
                type: "positive",
                text:
                    "Moderate wind raises the estimate."
            });

        } else if (
            wind > 20
        ) {

            score -= 10;

            reasons.push({
                type: "negative",
                text:
                    "Strong wind lowers the estimate."
            });

        } else if (
            wind < 3
        ) {

            score += 2;

            reasons.push({
                type: "neutral",
                text:
                    "Very light wind has little effect on the score."
            });

        } else {

            score += 3;

            reasons.push({
                type: "neutral",
                text:
                    "Wind is within a moderate range."
            });
        }


        /* PRESSURE */

        if (
            pressure >= 1015
        ) {

            score += 8;

            reasons.push({
                type: "positive",
                text:
                    "Higher surface pressure raises the estimate."
            });

        } else if (
            pressure < 1005
        ) {

            score -= 4;

            reasons.push({
                type: "negative",
                text:
                    "Lower surface pressure reduces the estimate."
            });

        } else {

            score += 2;

            reasons.push({
                type: "neutral",
                text:
                    "Pressure is near the middle of the scoring range."
            });
        }


        /* PRECIPITATION */

        if (
            precipitation >= 0.15
        ) {

            score -= 10;

            reasons.push({
                type: "negative",
                text:
                    "Heavier current precipitation lowers the estimate."
            });

        } else if (
            precipitation > 0
        ) {

            score -= 2;

            reasons.push({
                type: "neutral",
                text:
                    "Light precipitation slightly lowers the estimate."
            });

        } else {

            score += 4;

            reasons.push({
                type: "positive",
                text:
                    "No current precipitation raises the estimate slightly."
            });
        }


        /* TIME RELATIVE TO SUNRISE / SUNSET */

        const timeResult =
            calculateTimeFactor();


        score +=
            timeResult.points;


        reasons.push({
            type:
                timeResult.type,
            text:
                timeResult.reason
        });


        score =
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round(score)
                )
            );


        renderActivity(
            score,
            reasons,
            timeResult
        );
    }


    function calculateTimeFactor() {

        const now =
            new Date();


        const sunrise =
            weatherData.sunrise
                ? new Date(
                    weatherData.sunrise
                )
                : null;


        const sunset =
            weatherData.sunset
                ? new Date(
                    weatherData.sunset
                )
                : null;


        if (
            !sunrise ||
            !sunset ||
            Number.isNaN(
                sunrise.getTime()
            ) ||
            Number.isNaN(
                sunset.getTime()
            )
        ) {

            return {
                points: 0,
                type: "neutral",
                label: "Unknown",
                reason:
                    "Sunrise and sunset timing is unavailable.",
                bestWindow: "--"
            };
        }


        const minutesFromSunrise =
            Math.abs(
                now - sunrise
            ) /
            60000;


        const minutesFromSunset =
            Math.abs(
                now - sunset
            ) /
            60000;


        const sunriseWindow =
            formatWindow(
                new Date(
                    sunrise.getTime() -
                    60 * 60000
                ),
                new Date(
                    sunrise.getTime() +
                    120 * 60000
                )
            );


        const sunsetWindow =
            formatWindow(
                new Date(
                    sunset.getTime() -
                    120 * 60000
                ),
                new Date(
                    sunset.getTime() +
                    30 * 60000
                )
            );


        let bestWindow =
            sunriseWindow +
            " or " +
            sunsetWindow;


        if (
            minutesFromSunrise <= 120
        ) {

            return {
                points: 15,
                type: "positive",
                label: "Morning",
                reason:
                    "Current time is close to sunrise, which raises this estimate.",
                bestWindow:
                    sunriseWindow
            };
        }


        if (
            minutesFromSunset <= 120
        ) {

            return {
                points: 15,
                type: "positive",
                label: "Evening",
                reason:
                    "Current time is close to sunset, which raises this estimate.",
                bestWindow:
                    sunsetWindow
            };
        }


        if (
            now > sunrise &&
            now < sunset
        ) {

            return {
                points: 2,
                type: "neutral",
                label: "Daylight",
                reason:
                    "Current time is outside the sunrise and sunset scoring windows.",
                bestWindow:
                    bestWindow
            };
        }


        return {
            points: 4,
            type: "neutral",
            label: "Night",
            reason:
                "It is currently outside daylight hours.",
            bestWindow:
                bestWindow
        };
    }


    function formatWindow(
        start,
        end
    ) {

        return (
            start.toLocaleTimeString(
                [],
                {
                    hour:
                        "numeric",
                    minute:
                        "2-digit"
                }
            ) +
            "–" +
            end.toLocaleTimeString(
                [],
                {
                    hour:
                        "numeric",
                    minute:
                        "2-digit"
                }
            )
        );
    }


    function renderActivity(
        score,
        reasons,
        timeResult
    ) {

        setText(
            "activity-score",
            score
        );


        let rating =
            "Low";


        if (score >= 80) {
            rating =
                "Very High";
        } else if (
            score >= 65
        ) {
            rating =
                "High";
        } else if (
            score >= 45
        ) {
            rating =
                "Moderate";
        }


        setText(
            "activity-rating",
            rating + " Estimated Activity"
        );


        const scoreFill =
            document.getElementById(
                "score-fill"
            );

        if (scoreFill) {

            scoreFill.style.width =
                score + "%";
        }


        setText(
            "best-window",
            timeResult.bestWindow
        );


        setText(
            "window-description",
            "StandPoint favors periods near sunrise and sunset, then adjusts the estimate using current weather."
        );


        setText(
            "activity-temperature",
            Math.round(
                weatherData.temperature
            ) +
            "°F"
        );


        setText(
            "activity-wind",
            formatNumber(
                weatherData.windSpeed,
                1
            ) +
            " mph"
        );


        setText(
            "activity-pressure",
            Math.round(
                weatherData.pressure
            ) +
            " hPa"
        );


        setText(
            "activity-time",
            timeResult.label
        );


        setText(
            "activity-precipitation",
            weatherData.precipitation
                .toFixed(2) +
            " in"
        );


        const reasonContainer =
            document.getElementById(
                "activity-reasons"
            );


        if (reasonContainer) {

            reasonContainer.innerHTML =
                reasons.map(
                    function (reason) {

                        let symbol =
                            "•";

                        if (
                            reason.type ===
                            "positive"
                        ) {
                            symbol = "▲";
                        }

                        if (
                            reason.type ===
                            "negative"
                        ) {
                            symbol = "▼";
                        }


                        return (
                            '<div class="activity-reason">' +

                            '<span class="reason-' +
                            escapeHtml(
                                reason.type
                            ) +
                            '">' +
                            symbol +
                            "</span>" +

                            "<span>" +
                            escapeHtml(
                                reason.text
                            ) +
                            "</span>" +

                            "</div>"
                        );
                    }
                )
                .join("");
        }
    }


    /* =====================================================
       MODALS
    ===================================================== */

    function openModal(modal) {

        if (!modal) return;

        modal.classList.add("show");
    }


    function closeModal(modal) {

        if (!modal) return;

        modal.classList.remove("show");
    }


    if (closeMarkerButton) {

        closeMarkerButton.addEventListener(
            "click",
            function () {

                closeModal(
                    markerModal
                );

                clearPendingMarker();
            }
        );
    }


    if (closeMarkerDetails) {

        closeMarkerDetails.addEventListener(
            "click",
            function () {

                closeModal(
                    markerDetailsModal
                );

                clearPendingMarker();
            }
        );
    }


    if (closeSavedMarkers) {

        closeSavedMarkers.addEventListener(
            "click",
            function () {

                closeModal(
                    savedMarkersModal
                );
            }
        );
    }


    if (closeEditMarker) {

        closeEditMarker.addEventListener(
            "click",
            function () {

                selectedMarkerId =
                    null;

                closeModal(
                    editMarkerModal
                );
            }
        );
    }


    if (closeHuntDetails) {

        closeHuntDetails.addEventListener(
            "click",
            function () {

                selectedHuntId =
                    null;

                closeModal(
                    huntDetailsModal
                );
            }
        );
    }


    document.querySelectorAll(
        ".modal"
    ).forEach(
        function (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        closeModal(
                            modal
                        );


                        if (
                            modal ===
                            markerModal ||
                            modal ===
                            markerDetailsModal
                        ) {

                            clearPendingMarker();
                        }
                    }
                }
            );
        }
    );


    function clearPendingMarker() {

        pendingMarkerLocation =
            null;

        pendingMarkerType =
            null;


        if (
            mapSelectionMarker &&
            map
        ) {

            map.removeLayer(
                mapSelectionMarker
            );

            mapSelectionMarker =
                null;
        }
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    initializeMap();

    displayHuntHistory();

    updateCounts();

    updateHuntUI();

    startCompass();

    requestLocation(true);


    console.log(
        "StandPoint V1.0 loaded successfully."
    );

});