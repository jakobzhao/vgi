mapboxgl.accessToken = config.accessToken;

let current_category = ''; // record the category of current clicked venue
let current_confidence = ''; // record the confidence level of current clicked venue
let current_venue_data; // record the overall venue data of selected year
let current_code_filter = []; // tracking the filters user selected
let on_Screen_Data_Venue; // venue data with the filter
let referenceList = {};
let clickedFeature = null;

const localities = {
  'seattle': {
    center: [-122.3321, 47.6062],
    zoom: 14,
    state: 'WA'
  },
  'atlanta': {
    center: [-84.3880, 33.7490],
    zoom: 14,
    state: 'GA'
  },
  'nashville': {
    center: [-86.7816, 36.1627],
    zoom: 14,
    state: 'TN'
  },
  'cleveland': {
    center: [-81.6944, 41.4993],
    zoom: 14,
    state: 'OH'
  },
  'kansas city': {
    center: [-94.59926, 39.102116],
    zoom: 14,
    state: 'MO & KS'
  },
  'phoenix': {
    center: [-112.072754, 33.44277],
    zoom: 14,
    state: 'AZ'
  },
  'billings': {
    center: [-108.489304, 45.787636],
    zoom: 14,
    state: 'MT'
  },
  'mobile': {
    center: [-88.039894, 30.695366],
    zoom: 14,
    state: 'AL'
  },
  'ann arbor': {
    center: [-83.732124, 42.279594],
    zoom: 14,
    state: 'MI'
  },
  'san diego': {
    center: [-117.1611, 32.7157],
    zoom: 14,
    state: 'CA'
  },
  'boston': {
    center: [-71.0589, 42.3601],
    zoom: 14,
    state: 'MA'
  }
};

// check window size and close the left panel
// window.addEventListener("resize", function() {
//   if (this.window.matchMedia("(max-width: 1027px)").matches) {
//     document.getElementById('info').classList.toggle('leftCollapse');
//     this.document.getElementById('year-slider').style = "left: 0em";
//     this.document.getElementById('attribution').style = "left: 0em";
//     this.document.getElementById('legend').style = "left: 0em";
//   }
// })

// get the browser type (some style not working in firefox)
function myBrowser() {
  let userAgent = navigator.userAgent;
  let isChrome = userAgent.indexOf("Chrome") > -1;
  if (isChrome) {
    document.getElementById('year-slider').className += " Chrome";
  }
}
myBrowser();

// initialize geometry and material of our cube object
const geometry = new THREE.CylinderGeometry(15, 15, 32, 32);
const origMaterial = new THREE.MeshPhysicalMaterial({
  flatShading: true,
  color: '#D3B1C2',
  transparent: false,
  opacity: 0.8
});

const transMaterial = new THREE.MeshPhysicalMaterial({
  flatShading: true,
  color: '#D3B1C2',
  transparent: false,
  opacity: 0.2
});

const materialOnClick = new THREE.MeshPhysicalMaterial({
  flatShading: true,
  color: '#ff6262',
});


const materialOnHover = new THREE.MeshPhysicalMaterial({
  flatShading: true,
  color: '#69c3bb',
  transparent: true,
  opacity: 1
});

const cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
const lineGeometry = new THREE.CylinderGeometry(1, 1, 25, 10);


let map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/light-v10', // style URL
  center: [-122.33502, 47.61497], // starting position [lng, lat]
  zoom: 14, // starting zoom
  pitch: 60,
  //bearing: -10.8,
  logoPosition: 'bottom-right',
  attributionControl: false,
  antialias: true,
  hash: true
});

map.addControl(new mapboxgl.NavigationControl());

let subMap = new mapboxgl.Map({
  container: 'subMap', // container ID
  style: 'mapbox://styles/mapbox/light-v10', // style URL
  center: [-122.33502, 47.61497],
  zoom: 13, // starting zoom
  pitch: 60,
  // bearing: -10.8,
  attributionControl: false,
  antialias: true,
});

// create temporary marker if user wants to validate a location
let marker = new mapboxgl.Marker({
  draggable: true
});

let venues = null;
let observations = null;
initiateGeocoder();
createLocalityList();




//Bo: not sure why we need these two images, but if we delete it, bugs incur.
map.loadImage('assets/imgs/marker.png', function (error, image) {
  if (error) throw error;
  map.addImage('init-marker', image, {
    sdf: true
  });
});

map.loadImage('assets/imgs/red-marker.png', function (error, image) {
  if (error) throw error;
  map.addImage('red-marker', image, {
    sdf: true
  });
});


// initiate the Geocoder
function initiateGeocoder() {
  document.getElementsByClassName('mapboxgl-ctrl-top-right')[0].classList.add('navi-ctrls');
  // geocoding search bar
  let geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    placeholder: "Search for an address on MapBox ...",
    enableGeoLocation: true
  }).onAdd(map);

  document.getElementById('geocoder').appendChild(geocoder);
}



// compose the venue list in order to show it in the legend table.
function venueList(data) {
  for (const element of data) {
    let venueParent = document.getElementById('venue-list');
    let venueDiv = document.createElement('div');
    venueDiv.classList.add('m-3');
    venueDiv.innerHTML = element.name;
    venueParent.appendChild(venueDiv);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var venueLayer = document.getElementById('venue-layer');
  venueLayer.addEventListener('click', function() {
      var isExpanded = venueLayer.getAttribute('aria-expanded') === 'true';
      var spanText = venueLayer.querySelector('span');
      if (isExpanded) {
          spanText.textContent = ' (click to collapse)';
      } else {
          spanText.textContent = ' (click to expand)';
      }
  });
});

// allCodes
// Obtain data from database containing information for all the damron codes that appear in
// given years according to issued Damron book
async function allCodes() {
  try {
    let getCodes = await fetch('https://lgbtqspaces-api.herokuapp.com/api/all-codes', {
      method: 'GET'
    });
    let codeData = await getCodes.json();
    let sortedData = await sortCodes(codeData);
    return sortedData;
  } catch (err) {
    console.log(err);
  }
}

// organize all codes to data format: cid, code, name, years
function sortCodes(data) {
  let sortedResult = {};
  for (let i = 0; i < data.length; i++) {
    sortedResult[i] = {
      'c_id': data[i].CID,
      'name': data[i].Name,
      'code': data[i].Code,
      'note': data[i].Note,
      'years': Object.keys(data[i]).filter(function (key) {
        return data[i][key] == 1
      })
    };
  }
  return sortedResult;
}

// getReviews
// Obtain data from database containing information for all the reviews of a specific location
/* async function getReviews(vid) {
  try {
    let id = vid;
    let getReview = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/comment/${id}`, {
      method: 'GET'
    });
    let reviewData = await getReview.json();
    return reviewData;
  } catch (err) {
    console.log(err);
  }
}

// addNewReview
// Insert data into database and adds a new review to the corresponding VID
async function addNewReview(event, id) {
  event.preventDefault();
  // obtain data from user input form
  let newReview = new URLSearchParams();
  newReview.append('vid', id);
  newReview.append('review', document.getElementById('user-review-input').value);

  let settings = {
    method: 'POST',
    body: newReview
  }

  try {
    await fetch('https://lgbtqspaces-api.herokuapp.com/api/add-comment', settings);
    confirmationReview();
    getReviews(id);
  } catch (err) {
    checkStatus(err);
  }
}

// confirmationReview
// Display user reaction screen when review is confirmed and is submitted into database
function confirmationReview() {
  // hide and remove comment textarea
  let reviewBox = document.getElementById('type-review-box');
  let textBox = document.getElementById('user-review-input');
  textBox.value = '';
  reviewBox.classList.add('d-none');

  // display user reaction confirmation screen
  let reviewCheck = document.getElementById('reviews-confirmation');
  reviewCheck.classList.remove('d-none');
  setTimeout(function () {
    reviewCheck.classList.add('d-none')
  }, 3000);
} */

// getVenues
// Obtain the data from the database given the input values from the year slider
// returns a complete GEOJSON data output that is filtered with the matching dates
async function getVenues(locality) {
  try {

    let venueData = [];
    let getVenueData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/venues/${locality}`, {
      method: 'GET'
    });
    getVenueData = await getVenueData.json();
    venueData = venueData.concat(getVenueData);
    // }
    return toGEOJSON(venueData);
  } catch (error) {
    console.log(error);
  }
};

// getObservations
async function getObservations(locality) {
  try {
    let getObservationData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/observations/${locality}`, {
      method: 'GET'
    });
    let observationData = await getObservationData.json();
    return toGEOJSON(observationData);
  } catch (err) {
    console.log(err);
  }
};

// get vid observations and per year
async function getObservationsVID(vid, year) {
  try {
    let getObservationsVidData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/relatedobservations/${vid}/${year}`, {
      method: 'GET'
    });
    let returnData = await getObservationsVidData.json();
    return toGEOJSON(returnData);
  } catch (err) {
    console.log(err);
  }
}

async function getPreviews(locality) {
  try {

    let previewData = [];
    let getPreviewData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/previews/${locality}`, {
      method: 'GET'
    });
    getPreviewData = await getPreviewData.json();
    previewData = previewData.concat(getPreviewData);
    // }
    return toGEOJSON(previewData);
  } catch (error) {
    console.log(error);
  }
};

// converts json input  to geojson output
function toGEOJSON(data) {
  let feature_list = [];
  // for loop
  for (const element of data) {
    let temp = {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [element.longitude, element.latitude]
      },
      "properties": getProperties(element)
    }
    feature_list.push(temp);
  }
  // add into feature_list
  // combine with geojson final format with feature collection and feature as feature list
  return {
    "type": "FeatureCollection",
    "features": feature_list
  };
}

// Creating polygon geojson file for inset map view
function toPolygonGEOJSON(data) {
  let feature_list = [];
  let options = {
    steps: 100,
    units: 'kilometers'
  };
  let color;
  let polygonRadius;
  // lgbtq flag color
  let colorCode = {
    6: ['', '', '', '', '', '#9e0142', '#a90d45', '#b41a47', '#c0264a', '#cb334d'],
    7: ['#d63f4f', '#dc494c', '#e2524a', '#e95c47', '#ef6545', '#f47044', '#f67d4a', '#f88a50', '#fa9757', '#fdbb6c'],
    8: ['#fdc575', '#fed07d', '#feda86', '#fee38f', '#fee99a', '#feefa4', '#fdb164', '#feefa4', '#fff6af', '#fffcba'],
    9: ['#fcfebb', '#f7fcb3', '#f2faab', '#edf8a3', '#e8f69b', '#dff299', '#d3ed9c', '#c7e89e', '#bbe3a1', '#afdea3'],
    0: ['#a1d9a4', '#93d4a4', '#85cea5', '#77c9a5', '#69c3a5', '#5eb9a9', '#53adae', '#48a1b3', '#3e95b8', '#3389bd'],
    1: ['#3a7eb8', '#4372b3', '#4c66ad', '#555ba8', '#5e4fa2']
  };

  let countColor = 0;
  // Create a Set to store unique names
  let uniqueNames = new Set();
  let uniqueAddress = new Set();
  // const insetlegend = document.getElementById('inset-legend');
  for (const element of data) {
    uniqueNames.add(element.properties.observedvenuename.trim());
    uniqueAddress.add(element.properties.address.trim().toLowerCase());
    let coordinates = element.geometry.coordinates.slice();
    color = colorCode[parseInt(element.properties.year % 100 / 10)][element.properties.year % 10];
    // polygon radious
    polygonRadius = 0.1;
    countColor += 1;
    let temp = {
      "type": "Feature",
      'id': element.properties.vsid,
      "geometry": {
        "type": "Polygon",
        "coordinates": turf.circle(coordinates, polygonRadius, options).geometry.coordinates
      },
      "properties": {
        'name': element.properties.address,
        'year': element.properties.year,
        'vid': element.properties.vid,
        'vsid': element.properties.vsid,
        'center': JSON.parse(JSON.stringify(element.geometry)),
        'height': (element.properties.year - 1964) * 10,
        'base': (element.properties.year - 1965) * 10,
        'color': color,
      }
    }
    feature_list.push(temp);
  }

  // Compare the size of the Set with the length of the array
  if (uniqueNames.size < 2) {
    document.getElementById("name-tip").classList.add('d-none');
    document.getElementById("name-disclaimer").classList.add('d-none');
  } else {
    let nameElement = document.getElementById("name").innerText.trim();
    if (nameElement && uniqueNames.has(nameElement)) {
        uniqueNames.delete(nameElement);
    }
    const aliases = Array.from(uniqueNames).join(', ');
    // Update the title attribute of the tooltip icon element
    document.getElementById("name-tip").setAttribute('title', 'May also be known as: ' + aliases + '.');
    document.getElementById("name-tip").classList.remove('d-none');
    document.getElementById("name-disclaimer").classList.remove('d-none');
  }
  if (uniqueAddress.size < 2) {
    document.getElementById("address-tip").classList.add('d-none');
    document.getElementById("address-disclaimer").classList.add('d-none');
  } else {
    let addressElement = document.getElementById("address").innerText.trim().toLowerCase();
    if (addressElement && uniqueAddress.has(addressElement)) {
        uniqueAddress.delete(addressElement);
    }
    const aliases = Array.from(uniqueAddress).join(', ');
    // Update the title attribute of the tooltip icon element
    document.getElementById("address-tip").setAttribute('title', "Other possible addresses over the years: " + aliases);
    document.getElementById("address-tip").classList.remove('d-none')
    document.getElementById("address-disclaimer").classList.remove('d-none')
  }

  // add into feature_list
  // combine with geojson final format with feature collection and feature as feature list
  return {
    "type": "FeatureCollection",
    "features": feature_list
  };
};

// it's a toGEOJSON function for data not fitting into the first toGEOJSON function
function toSecondaryGEOJSON(data) {
  let feature_list = [];
  // for loop
  for (const element of data) {
    let temp = {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [element.geometry.coordinates[0], element.geometry.coordinates[1]]
      },
      "properties": getSecondaryProperties(element)
    }
    feature_list.push(temp);
  }
  // add into feature_list
  // combine with geojson final format with feature collection and feature as feature list
  return {
    "type": "FeatureCollection",
    "features": feature_list
  };
};

// getProperties(data)
// Parameters: data - input array elements from JSON
// Returns an object that is to be added onto the geoJSON output
function getSecondaryProperties(data) {
  let result = {};
  for (const properties in data.properties) {
    if (properties != 'longitude' && properties != 'latitude') {
      // convert code string to javascript array
      if (properties == 'codedescriptorlist' && data.codedescriptorlist != null) {
        result[properties] = data.properties[properties].split(', ');
      } else {
        result[properties] = data.properties[properties];
      }
    }
  }
  return result;
};

function getProperties(data) {
  let result = {};
  for (const properties in data) {
    if (properties != 'longitude' && properties != 'latitude') {
      // convert code string to javascript array
      if (properties == 'codedescriptorlist' && data.codedescriptorlist != null) {
        result[properties] = data[properties].split(', ');
      } else {
        result[properties] = data[properties];
      }
    }
  }
  return result;
};
// Add observation and venueSliceData data layer onto map
function addVenueLayer(map, obsData) {
  if (map.getLayer('data')) {
    map.removeLayer('data');
    map.removeSource("data");
  };
  if (map.getLayer('observation')) {
    map.removeLayer('observation');
  };
  //removeAllLayers();
  map.addLayer({
    'id': 'data',
    'type': 'symbol',
    'source': {
      type: 'geojson',
      data: obsData,
      generateId: true
    },
    'tolerance': 0,
    'layout': {
      'icon-image': 'init-marker',
      'icon-size': 3,
      'icon-allow-overlap': true,
      'text-allow-overlap': true
    },
    'paint': {
      'icon-opacity': 0,
      'icon-color': '#ff6262'
    }
  });
};

// assign switch layer function for all radio button inputs
// var layerList = document.getElementsByClassName('layers-input-container');
document.getElementById("functioning-layer").onclick = switchLayer;

function switchLayer(layer) {
  // light-v10
  // satellite-v9
  satLyrStatus = map.getLayer('satellite-layer');

  if (satLyrStatus == undefined) {
    map.addSource("mapbox-satellite", {
      "type": "raster",
      "url": "mapbox://mapbox.satellite",
      "tileSize": 256
    });
    map.addLayer({
        'id': 'satellite-layer',
        'type': 'raster',
        'source': 'mapbox-satellite',
        'paint': {}
      },
      'road-label'
    );

    document.getElementById('default-basemap').src = "assets/imgs/satellite.PNG";
    document.getElementById("functioning-layer").src = "assets/imgs/light.PNG";

  } else if (satLyrStatus) {
    if (satLyrStatus.visibility == 'visible') {
      map.setLayoutProperty("satellite-layer", 'visibility', "none");
      document.getElementById('default-basemap').src = "assets/imgs/light.PNG";
      document.getElementById("functioning-layer").src = "assets/imgs/satellite.PNG";

    } else {

      map.setLayoutProperty("satellite-layer", 'visibility', "visible");
      // satLyrStatus.visibility = 'none';
      document.getElementById('default-basemap').src = "assets/imgs/satellite.PNG";
      document.getElementById("functioning-layer").src = "assets/imgs/light.PNG";


    }

  } else {
    exit - 1;
  }

};


function removeAllLayers(exclusion) {
  let layers = ['buffer-point', 'year-block', 'year-block-line', 'poi-labels', 'venue-slice-layer', 'highlighted-year'];
  let sources = ['venues', 'buffer-point', 'year-block', 'year-block-line'];

  layers = layers.filter(item => item !== exclusion)
  sources = sources.filter(item => item !== exclusion)
  for (let layer of layers) {
    if (map.getLayer(layer)  ) {
      map.removeLayer(layer);
    };
  }
  for (let source of sources ) {
    if (map.getSource(source)) {
      map.removeSource(source);
    };
  }
}

subMap.on('load', function () {
  subMap.on('click', 'year-extrusion', function (e) {
    let vsid = e.features[0].properties.vsid;
    let geometry = JSON.parse(e.features[0].properties.center);
    let selectedYear = e.features[0].properties.year;
    let selectedLocality = document.querySelector(".dropdown-item-checked").text.split(",")[0];
    updateMap(selectedYear, selectedLocality, exclusion="buffer-point");
    document.getElementById('year-label').innerHTML = selectedYear;
    document.getElementById('slider-bar').value = selectedYear;
    
      //fly to where the venue locates
      map.flyTo({
        center: geometry.coordinates
      });
      subMap.flyTo({
        center: geometry.coordinates
      });
    let data = venues.features.filter(function (feature) {
      return feature.properties.vsid == vsid
    });
    let codes = infoNullCheck(data[0].properties.descriptorlist);
    if (typeof (codes) == 'string') {
      let codeString = "";
      for (const element of codes) {
        if (element !== '[' && element !== '"' && element !== '.' && element !== ']' && element !== "'") {
          codeString += element;
        }
      }
      codes = codeString.split(',');
    }
    if (codes == null) {
      codes = "";
    }

    for (let i = 0; i < codes.length; i++) {
      codes[i] = codes[i].replaceAll('\'', '');
    }
    document.getElementById('code').innerHTML = '';
    for (const element of codes) {
      let code = document.createElement("button");
      code.innerText = element;
      code.className = 'descriptor';
      code.addEventListener('click', function () {
        document.getElementById('clear-button').click();
        document.getElementById(element).click();
      });
      document.getElementById('code').appendChild(code);
    }

    if (source == 'Local Expert') {
      sourceText = 'Local expert contribution';
    } else if (source == 'Damron' || source == 'Damron M' || source == 'DamronM') {
      sourceText = 'Damron Men\'s Guide ' +  infoNullCheck(e.properties.year) + ' edition';
    } else if (source == 'Damron W') {
      sourceText = 'Damron Women\'s Guide ' +  infoNullCheck(e.properties.year) + ' edition';
    } else {
      sourceText = 'Unavailable'
    } 

    let source = infoNullCheck(data[0].properties.source);
    if (source == 'Local Expert') {
      sourceText = 'Local expert contribution';
    } else if (source == 'Damron' || source == 'Damron M' || source == 'DamronM') {
      sourceText = 'Damron Men\'s Guide ' +  infoNullCheck(e.properties.year) + ' edition';
    } else if (source == 'Damron W') {
      sourceText = 'Damron Women\'s Guide ' +  infoNullCheck(e.properties.year) + ' edition';
    } else {
      sourceText = 'Unavailable';
    } 

    // left panel location information
    document.getElementById('name').innerHTML = infoNullCheck(data[0].properties.observedvenuename);
    document.getElementById('address').innerHTML = infoNullCheck(data[0].properties.address);
    document.getElementById('year-info').innerHTML = infoNullCheck(data[0].properties.year);
    document.getElementById('source').innerHTML = sourceText;
    document.getElementById('city').innerHTML = infoNullCheck(data[0].properties.city);
    document.getElementById('state').innerHTML = infoNullCheck(data[0].properties.state);
  })

  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: "hover-popup"
  });

  subMap.on('mousemove', 'year-extrusion', (e) => {
    let bufferedFeature = turf.buffer(e.features[0], 0.01, {units: 'kilometers'});
    subMap.getSource('highlighted-year').setData(bufferedFeature);
    subMap.setPaintProperty('highlighted-year', 'fill-extrusion-height', e.features[0].properties.height + 1);
    subMap.setPaintProperty('highlighted-year', 'fill-extrusion-base', e.features[0].properties.height - 10);

    popup.setLngLat(subMap.getCenter())
    .setHTML(e.features[0].properties.year)
    .addTo(subMap);


    //console.log(e.features[0].properties.year);

    subMap.getCanvas().style.cursor = 'pointer';
    var color_icon = document.getElementById('color_icon');
    var color_year = document.getElementById('color_year');
    color_icon.style.display = 'block';
    color_icon.style.left =   (e.features[0].properties.year - 1964)* 2 + '%';
    color_year.style.left = (e.features[0].properties.year - 1964)* 2 + '%';
  });

  subMap.on('mouseleave', 'year-extrusion', (e) => {
    if (!map.getLayer('highlighted-year')) {
      subMap.getSource('highlighted-year').setData({
        type: 'FeatureCollection',
        features: []
      });
    }

    subMap.getCanvas().style.cursor = '';
    popup.remove();
    color_icon.style.display = 'none';
  });

  subMap.on('click', function (e) {
    // Clear the clicked feature if the click was not on the 'year-extrusion' layer
    if (e.originalEvent.target.id !== 'highlighted-year') {
      clickedFeature = null;
    }
  });
})

// function slide-in left panel
function viewLeftPanel(e) {
  let filteredLocalData = venues.features.filter(function (feature) {
    return feature.properties.vid == e.properties.vid;
  });

  //find alternative sources for the venue
  let alternativeSource = venues.features.filter(function (feature) {
    return feature.properties.vid == e.properties.vid & feature.properties.year == e.properties.year;
  });
  
  let uniqueCodes = new Set();
  let uniqueSources = new Set();

  for (const e of alternativeSource) {
    // parse the codes to increase readability
    let codes = infoNullCheck(e.properties.descriptorlist);
    if (typeof (codes) == 'string') {
      let codeString = "";
      for (const element of codes) {
        if (element !== '[' && element !== '"' && element !== '.' && element !== ']' && element !== "'") {
          codeString += element;
        }
      }
      codes = codeString.split(',');
    }
    //@jakobzhao: if no code in the code list
    if (codes == null) {
      codes = "";
    }
    
    if (codes) {
      for (const code of codes) {
        uniqueCodes.add(code.replaceAll('\'', ''));
      }
    }

  let source = infoNullCheck(e.properties.source);
    if (source) {
      uniqueSources.add(source);
    }
  }
  
  document.getElementById('code').innerHTML = '';
  for (const codeText of uniqueCodes) {
    let codeButton = document.createElement("button");
    codeButton.innerText = codeText;
    codeButton.className = 'descriptor';
    codeButton.addEventListener('click', function () {
      document.getElementById('clear-button').click();
      document.getElementById(codeText).click();
    });
    document.getElementById('code').appendChild(codeButton);
  }

  let sourceText = "";
  for (const source of uniqueSources) {
    if (source == 'Local Expert') {
      sourceText += 'Local expert contribution, ';
    } else if (source == 'Damron' || source == 'Damron M' || source == 'DamronM') {
      sourceText += 'Damron Men\'s Guide ' + infoNullCheck(e.properties.year) + ' edition, ';
    } else if (source == 'Damron W') {
      sourceText += 'Damron Women\'s Guide ' + infoNullCheck(e.properties.year) + ' edition, ';
    } else {
      sourceText += 'Unavailable, ';
    }
  }

  // Remove trailing comma and space
  if (sourceText.endsWith(', ')) {
    sourceText = sourceText.slice(0, -2);
  }
    

  // left panel location information
  document.getElementById('name').innerHTML = infoNullCheck(e.properties.observedvenuename);
  document.getElementById('address').innerHTML = infoNullCheck(e.properties.address) + ',  ' + infoNullCheck(e.properties.city) + ', ' + infoNullCheck(e.properties.state);
  // document.getElementById('year-info').innerHTML = infoNullCheck(e.properties.year);
  document.getElementById('source').innerHTML = sourceText;
  // document.getElementById('city').innerHTML = infoNullCheck(e.properties.city);
  // document.getElementById('state').innerHTML = infoNullCheck(e.properties.state);
  document.getElementById('last-update').innerText = 
    "*Our data for this venue was last updated on " + 
    infoNullCheck(formatDate(e.properties.lastmodified));
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are 0-11, hence adding 1
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  //vid for comment
  // document.getElementById('vid-review').innerHTML = e.properties.vid;

  // Inset map, extrusion, and functions
  // subMap.on('load', function () {
  subMap.setCenter(e.geometry.coordinates);
  // Remove 'year-extrusion' layer if it exists
if (subMap.getLayer('year-extrusion')) {
    subMap.removeLayer('year-extrusion');
}

// Remove 'year-indicator' layer if it exists
if (subMap.getLayer('year-indicator')) {
    subMap.removeLayer('year-indicator');
}

// Once both layers are removed, remove 'dataByYear' source if it exists
if (subMap.getSource('dataByYear')) {
    subMap.removeSource('dataByYear');
}

  subMap.addSource('dataByYear', {
    'type': 'geojson',
    'data': toPolygonGEOJSON(filteredLocalData)
  });
  subMap.addLayer({
    'id': 'year-extrusion',
    'type': 'fill-extrusion',
    'source': 'dataByYear',
    'paint': {
      'fill-extrusion-color': {
        'type': 'identity',
        'property': 'color'
      },
      'fill-extrusion-height': {
        'type': 'identity',
        'property': 'height'
      },
      'fill-extrusion-base': {
        'type': 'identity',
        'property': 'base'
      },
      'fill-extrusion-opacity': 0.9
    }
  });

//shadow of missing year value

  subMap.addLayer({
    'id': 'year-indicator',
    'type': 'fill-extrusion',
    'source': 'dataByYear',
    'paint': {
      'fill-extrusion-color': {
        'type': 'identity',
        'property': '#D3D3D3'
      },
      'fill-extrusion-height': {
        'type': 'identity',
        'property': 'height'
      },
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.1
    }
  });
  

if (!subMap.getLayer('highlighted-year')) {
  subMap.addLayer({
    id: 'highlighted-year',
    type: 'fill-extrusion',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    },
    paint: {
      'fill-extrusion-color': 'red',
      'fill-extrusion-height': {
        'type': 'identity',
        'property': 'height'
      },
      'fill-extrusion-base': {
        'type': 'identity',
        'property': 'base'
      },
      'fill-extrusion-opacity': 0.9
    }
  });
}
  



  let yearList = [];
  let address = [];
  let timelineOfAddress = {};
  referenceList = {};
  let text;
  for (let data of filteredLocalData) {
    let key = (data.geometry.coordinates[0] + ', ' + data.geometry.coordinates[1])
    if (!yearList.includes(Number(data.properties.year))) {
      yearList.push(Number(data.properties.year))
    }
    if (!address.includes(key)) {
      address.push(key)
      timelineOfAddress[key] = [data.properties.year];
    } else {
      timelineOfAddress[key].push(data.properties.year);
    }
  }
  yearList.sort();
  filteredLocalData.forEach(function (datum) {
    let key = (datum.geometry.coordinates[0] + ', ' + datum.geometry.coordinates[1])
    text = '<strong>Year Range: </strong>';
    if (timelineOfAddress[key].length > 1) {
      text = text + Math.min(...timelineOfAddress[key]).toString() + ' to ' + Math.max(...timelineOfAddress[key]).toString();
    } else {
      text = text + Math.min(...timelineOfAddress[key]).toString();
    }
    referenceList[datum.properties.year] = text;
  });
}


// Go to
function goToButton(vsid) {
  let data = venues.features.filter(function (feature) {
    return feature.properties.vsid == vsid
  });
  viewLeftPanel(data[0]);
}

function infoNullCheck(string) {
  return ((string != "null") ? string : 'data unavailable');
}
// left panel functionalities (validate observation marker view, selected marker view, map zoom to selected point)
async function addLeftPanelActions(feature, marker) {
  sessionStorage.removeItem("defaultCheckbox");
  let coordinates = feature.geometry.coordinates.slice();
  //for those in the list (no specific latlng was found, the program should skip the following lines.)
  try {
    let point = feature.geometry.coordinates;
    point[0] -= 0.001
    map.flyTo({
      center: point,
      zoom: 16.5,
      speed: 0.3,
      pitch: 60,
      //bearing: -25,
      essential: true
    });
  } catch (error) {
    console.log(error);
  }

  // if "report an issue" button is clicked, display movable marker
  let reportIssue = document.getElementById('report-issue-btn');
  if (!reportIssue.hasEventListener) {
    reportIssue.addEventListener('click', populateEditForm);
    reportIssue.hasEventListener = true;
  }

  async function populateEditForm() {
    // ensure that user is logged-in
    let check = logInCheck();
    if (check) {
      if (typeof map.getLayer('selectedMarker') !== "undefined") {
        map.removeLayer('selectedMarker');
        map.removeSource('selectedMarker');
      }

      map.addSource('selectedMarker', {
        "type": 'geojson',
        'data': feature,
        'tolerance': 0
      });

      map.addLayer({
        'id': 'selectedMarker',
        'type': 'symbol',
        'source': 'selectedMarker',
        'tolerance': 0,
        'layout': {
          'icon-image': 'red-marker',
          // 'icon-allow-overlap': true,
          // 'text-allow-overlap': true
        },
        'paint': {
          'icon-opacity': 0,
          'icon-color': '#7b2941'
        }
      });

      // Populate/Organize checkbox for clientele, amenity, caution, organization
      let checkbox = await import('./checkboxEdit.js');
      let populateInput = await import('./populateInputFields.js');

      // Populate Input Fields
      populateInput.populateInputFields(feature);
      // Autofill checkboxes to corresponding values
      checkbox.autoFill(feature);
      // left panel view toggle
      // Submit Edit and send POST request
      marker.setLngLat(coordinates).addTo(map);

      function onDragEnd() {
        let lngLat = marker.getLngLat();
        document.getElementById('long-edit').value = lngLat.lng;
        document.getElementById('lat-edit').value = lngLat.lat;
      }
      marker.on('dragend', onDragEnd);
      onDragEnd();
      toggleLeftPanelView('report-issue');
      document.getElementById('ground-truth-btns').classList.toggle('d-none');
      if (document.getElementById('info').classList.contains('leftCollapse')) {
        document.getElementById('info').classList.remove('leftCollapse')
      }
      document.getElementById('alert-cls-btn').addEventListener('click', function () {
        marker.remove();
      })
    }
  }
}

// if a specific locality is selected, recenter the map to that locality
function createLocalityList() {
  let localityFilterBtn = document.getElementById("localityFilterBtn");
  localityFilterBtn.addEventListener('click', function () {
    let localityList = document.getElementById('localityList');
    localityList.classList.remove('d-none');

    let codeDescriptorList = document.getElementById('codeDescriptorList');
    codeDescriptorList.classList.add('d-none');
  });

  Object.entries(localities).forEach(locality => {

    let localityItem = document.createElement("li");

    let localityName = capitalizeWords(locality[0]);
    if (localityName == "Seattle") {
      localityItem.innerHTML = '<a class="dropdown-item dropdown-item-checked" href="#">' + localityName + ", " + locality[1].state + '</a>';
    } else {
      localityItem.innerHTML = '<a class="dropdown-item" href="#">' + localityName + ", " + locality[1].state + '</a>';
    }

    localityList.appendChild(localityItem);
    localityItem.addEventListener('click', async function handleClick() {

      let localityList = document.getElementById("localityList");
      localityList.querySelectorAll("a").forEach(localityItem => {
        if (localityItem.classList.contains("dropdown-item-checked")) {
          localityItem.classList.remove("dropdown-item-checked");
        }
      });

      map.flyTo({
        center: localities[locality[0]].center,
        zoom: localities[locality[0]].zoom,
        speed: 0.9,
        pitch: 60,
        //bearing: -25,
        essential: true
      });

      localityList.classList.add('d-none');
      localityItem.querySelector("a").classList.add("dropdown-item-checked");


      let selectedLocality = this.innerText.split(",")[0];
      let selectedYear = parseInt(document.getElementById('slider-bar').value);

      updateMap(selectedYear, selectedLocality);


    });

  });

}

// simple function that capitalizes words so that locality names are correctly formatted
function capitalizeWords(str) {
  return str
    .split(' ') // Split the string into words by space
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
    .join(' '); // Join the words back together with spaces
}

// create and style all incoming reviews from API request
/* function constructReviews(reviewData) {
  let reviewParent = document.getElementById('reviews-container');

  for (let element of reviewData) {
    let reviewDiv = document.createElement('div');
    reviewDiv.innerHTML = element.content;
    reviewDiv.classList.add('review-box');
    reviewParent.append(reviewDiv);
  }
}*/

// add div for the codes corresponding to selected year on the map
function code_div(codes, venueSlices, year) {
  let codeFilterBtn = document.getElementById("code-filter-btn");
  let codeParent = document.getElementById('codeDescriptorList');

  codeFilterBtn.addEventListener('click', function () {
    codeParent.classList.remove('d-none');

    let localityList = document.getElementById('localityList');
    localityList.classList.add('d-none');

  })


  while (codeParent.firstChild) {
    codeParent.removeChild(codeParent.firstChild);
  }


  let codeNames = [];

  Object.values(codes).forEach(code => {
    let filterCount = (codeFilter(venueSlices.features, year, code).length);
    if (!codeNames.includes(code.name)) {
      codeNames.push(code.name);
      let codeSubCategory = document.createElement('li');
      codeSubCategory.classList.add("metaDescriptor");
      codeSubCategory.innerHTML = '<a class="dropdown-item" href="#">' + code.name + '</a>';
      let codeSubCategoryMenu = document.createElement('ul');
      codeSubCategoryMenu.setAttribute("id", code.name.replace(/\s+/g, '').toLowerCase());
      codeSubCategoryMenu.classList.add("dropdown-menu");
      codeSubCategoryMenu.classList.add("dropdown-submenu");
      codeSubCategory.appendChild(codeSubCategoryMenu);
      codeParent.appendChild(codeSubCategory);
    }
    let categoryMenu = document.getElementById(code.name.replace(/\s+/g, '').toLowerCase());
    let codeItem = document.createElement('li');
    codeItem.innerHTML = '<a class="dropdown-item" href="#">' + code.code + ' (' + filterCount + ')' + '</a>';
    codeItem.id = code.code;
    ////////////////
    // for each code_div add event listener on click to add filter features of the map

    codeItem.addEventListener('click', function () {
      if (current_code_filter.length > 0) {
        makeAlert('You can only select one filter at one time');
      } else {
        codeParent.classList.add('d-none');
        // map.setFilter('data', ['in', code.code, ['get', 'codedescriptorlist']]);
        ///////////////////////////////////////////////////////////////////////////////////////////
        //remove 3D layer

        let result = codeFilter(venueSlices.features, year, code);
        on_Screen_Data_Venue = result;
        if (map.getLayer('venue-slice-layer')) {
          map.removeLayer('venue-slice-layer');
        };
        if (map.getLayer('poi-labels')) {
          map.removeLayer('poi-labels');
          map.removeSource('venues');
        };
        addVenues(result, false);
        ///////////////////////////////////////////////////////////////////////////////////////////
        document.getElementById("code-filter-btn").innerText = 'Current Filter: ' + codeItem.id;
        document.getElementById("clear-button").innerHTML = '<a class="dropdown-item" title="Clear all selected filters" href="#"> The filter <span id="applied-filter">' + code.code + '</span> is applied. \n  </br> Click here to remove this filter. </a>';
      }
    });

    if (filterCount != 0) {
      categoryMenu.appendChild(codeItem);
    }
  });


  //////////////////////////////clear function///////////////////////////////////////////
  let divider = document.createElement("li");
  divider.innerHTML = '<hr class="dropdown-divider">';
  let clear = document.createElement("li");
  clear.classList.add("metaDescriptor");
  clear.setAttribute("id", "clear-button");
  // clear.classList.add('');
  clear.innerHTML = '<a class="dropdown-item" title="Clear all selected filters" href="#"> No filter is currently applied. </a>';

  clear.addEventListener('click', function () {
    current_code_filter = [];
    codeParent.classList.add('d-none');
    document.getElementById('code-filter-btn').innerText = 'Filter';
    clear.innerHTML = '<a class="dropdown-item" title="Clear all selected filters" href="#"> No filter is currently applied. </a>';

    if (map.getLayer('venue-slice-layer')) {
      map.removeLayer('venue-slice-layer');
    };
    if (map.getLayer('poi-labels')) {
      map.removeLayer('poi-labels');
      map.removeSource('venues');
    };
    addVenues(current_venue_data, false);
  });

  codeParent.appendChild(divider);
  codeParent.appendChild(clear);

  ///////////////////////////////clear function///////////////////////////////////////////


}

function codeFilter(features, year, code) {
  let result = [];
  features.filter(function (feature) {
    if (feature.properties.year == year) {
      let dlist = feature.properties.descriptorlist;
      if (Array.isArray(dlist)) {
        for (i = 0; i < dlist.length; i++) {
          if (dlist[i].includes(code.code)) {
            result.push(feature);
          }
        }
      }
    }
  });
  return result;
}

// obtain descriptor codes of a corresponding year
function codeIncludes(codeData, year) {
  let result = {};
  // Obtain descriptor codes of a corresponding year
  for (let codeInfo in codeData) {
    let codeObj = codeData[codeInfo];
    //Temporarily disabling this until we find a better way to implement ity
    //if (codeObj.years.includes(year.toString())) {
    result[codeInfo] = codeObj;
    //}
  }
  return result;
}

/* function getEvidenceInfo(feature) {

  let streetviewDiv = document.getElementById('streetview-evidence');
  streetviewDiv.setAttribute('href', 'http://maps.google.com/maps?q=&layer=c&cbll=' + feature.geometry.coordinates[1] + ',' + feature.geometry.coordinates[0] + '&cbp=');

  let photoDiv = document.getElementById('image-evidence');
  try {
    photoDiv.setAttribute('href', 'https://www.google.com/search?tbm=isch&q=venue ' + feature.properties.observedvenuename + ' in ' + feature.properties.locality + ', ' + feature.properties.state + ' in the year ' + feature.properties.year);
  } catch (err) {
    photoDiv.setAttribute('href', 'https://www.google.com/search?tbm=isch&q=venue ' + feature.properties.observedvenuename + ' in ' + feature.properties.locality + ' in the year ' + feature.properties.year);

  }

  let tweetsDiv = document.getElementById('tweets-evidence');
  tweetsDiv.setAttribute('href', 'https://twitter.com/search?q=' + feature.properties.observedvenuename + '%20geocode%3A' + feature.geometry.coordinates[1] + '%2C' + feature.geometry.coordinates[0] + '%2C.1km&src=typed_query&f=top');

}*/

// getPhotos
// Function that utilizes the Google Maps and Places Javascript Library to obtain a default image of a location
// Requests uses a location bias and location names to search (similar to a google search)
// Parameters:
//  feature: javascript object that contains complete data of a clicked location

/*function getPhotos(feature) {
  let imgParent = document.getElementById('venue-imgs');
  let locationBias = new google.maps.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
  // set request data location name and set location bias
  let request = {
    query: feature.properties.observedvenuename,
    fields: ["place_id"],
    locationBias: locationBias
  }
  let placeId;
  let imgChild;
  // send request to get placeid
  let service = new google.maps.places.PlacesService(imgParent);
  service.findPlaceFromQuery(request, (results, status) => {
    while (imgParent.firstChild) {
      imgParent.removeChild(imgParent.firstChild);
    }
    if (status == google.maps.places.PlacesServiceStatus.OK && results) {
      placeId = results[0].place_id;
      // call another function to set
      imgChild = setImgURL(service, placeId);
      imgParent.appendChild(imgChild);
    } else {
      let imgChildError = document.createElement('img');
      imgChildError.src = './assets/imgs/img-placeholder.svg';
      imgParent.appendChild(imgChildError);
    }
  });
};*/

/*function setImgURL(service, placeId) {
  // new request to get imageURL
  let newRequest = {
    placeId: placeId,
    fields: ["photos"]
  };
  // get details of location
  let imgElement = document.createElement('img');
  service.getDetails(newRequest, (result, status) => {
    if (status == google.maps.places.PlacesServiceStatus.OK && result.hasOwnProperty('photos')) {
      let imgUrl = result.photos[0].getUrl(({
        maxWidth: 1000,
        maxHeight: 1250
      }));
      imgElement.src = imgUrl;
    } else {
      imgElement.src = './assets/imgs/img-placeholder.svg';
    }
  });
  return imgElement;
};*/


// add names to the venue geometry
function addLabels(data) {
  let result = {}
  result.type = "FeatureCollection";
  result.features = [];
  for (var id in data) {
    result.features.push(data[id])
  }
  if (map.getLayer('poi-labels')) {
    map.removeLayer('poi-labels');
    map.removeSource('venues');
  };

  map.addSource('venues', {
    'type': 'geojson',
    'data': result
  });

  map.addLayer({
    'id': 'poi-labels',
    'type': 'symbol',
    'source': 'venues',
    'layout': {
      'text-field': ['get', 'observedvenuename'],
      // 'text-field': ['get', 'confidence'], // BO: testing purpose.
      'text-variable-anchor': ['left'],
      'text-radial-offset': 0.5,
      'text-justify': 'right',
      'text-writing-mode': ['vertical'],
    },
    'paint': {
      'text-color': "#444",
      'text-halo-color': "#fff",
      'text-halo-width': 2
    },
  });
}

function makeLocalityList(localityID, data, selectedYear) {
  let localityParent = document.getElementById(localityID);
  localityParent.innerHTML = "";
  let localityFeatures = data.features;
  for (const element of localityFeatures) {
    let type = '';
    if (localityID == 'locality-venues') {
      type = element.properties.placetype;
    } else {
      type = element.properties.place_type;
    }
    if (element.properties.year == selectedYear && type != "P" && type != "T") {
      // bootstrap row
      let rowDiv = document.createElement('div');
      rowDiv.classList.add('row', "m-1");
      let Name = document.createElement('div');
      // let PlaceType = document.createElement('div');
      Name.classList.add('col');
      // PlaceType.classList.add("col", "col-sm-3");

      let placetype = type;

      Name.innerHTML = element.properties.observedvenuename;
      // PlaceType.innerHTML = placetype;

      rowDiv.appendChild(Name);
      // rowDiv.appendChild(PlaceType);

      localityParent.appendChild(rowDiv);
      rowDiv.addEventListener('click', function () {

        viewLeftPanel(element);
        addLeftPanelActions(element, marker);
        // getEvidenceInfo(element);
        if (document.getElementById('info-default').classList.contains('d-none')) {

          toggleLeftPanelView('info-default');
        } else {
          if (document.getElementById('info').classList.contains('leftCollapse')) {
            document.getElementById('info').classList.toggle('leftCollapse');
            toggleLeftPanelView('info-default');
          }
        }
      });
    }
  }
}

function addVenues(data, active) {
  if (map.getLayer('venue-slice-layer')) {
    map.removeLayer('venue-slice-layer');
  }
  if (data.length == 0) {
    document.getElementById("year-notes").innerHTML = "No venues from this locale of this year has been found in our database. If you know any venue does not shown on this database, please help us improve. "
  } else {
    document.getElementById("year-notes").innerHTML = "";
  }

  addLabels(data);

  map.addLayer({
    id: 'venue-slice-layer',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (map, mbxContext) {
      mbxContext = map.getCanvas().getContext('webgl');
      window.tb = new Threebox(
        map,
        mbxContext, {
          defaultLights: true,
          antialias: true
        }
      );

      data.forEach(function (datum) {
        // longitude, latitude, altitude

        // @jakobzhao: Warning: the duplicate function will make the material of all the cones the same.
        // let cone = coneTemplate.duplicate();
        let baseCone = new THREE.Mesh(geometry, origMaterial);
        cone = tb.Object3D({
          obj: baseCone,
          units: 'meters'
        }).set({
          rotation: {
            x: -90,
            y: 0,
            z: 0
          }
        });

        cone.setCoords([datum.geometry.coordinates[0], datum.geometry.coordinates[1], 20]);
        // Bo: Attach properties to each cone.
        cone.userData.properties = datum.properties


        tb.add(cone);
        // tb.add(line);
      })

      let highlighted = [];

      //add mousing interactions
      map.on('click', 'data', function (e) {
        // Yufei: Make sure when click another venue, the report-issue panel cleared
        marker.remove();
        if (!(document.getElementById('report-issue').classList.contains('d-none'))) {
          document.getElementById('report-issue').classList.add('d-none');
        }
        // info-default panel on
        if (document.getElementById('info-default').classList.contains('d-none')) {
          document.getElementById('info-default').classList.remove('d-none');
          document.getElementById('ground-truth-btns').classList.remove('d-none');
        }

        // Clear old objects
        highlighted.forEach(function (h) {
          h.material = origMaterial;
        });
        highlighted.length = 0;

        // clear past inset map info
        document.getElementById('subMap-info').innerHTML = "";
        // document.getElementById('go-btn').innerHTML = " ";

        // calculate objects intersecting the picking ray
        let intersect = tb.queryRenderedFeatures(e.point)[0];
        let intersectionExists = typeof intersect == "object";

        // make sure the confidence level colors don't get overwritten
        paintConfidence(document.getElementById('reliability-switch').checked);

        // if intersect exists, highlight it
        if (intersect) {
          let nearestObject = intersect.object;
          nearestObject.material = materialOnClick;
          highlighted.push(nearestObject);
          current_category = nearestObject.parent.userData.properties.category;
          // toggleLeftPanelView('info-default');
          // document.getElementById('info').classList.toggle('leftCollapse');
        }

        // on state change, fire a repaint
        if (active !== intersectionExists) {
          active = intersectionExists;
          tb.repaint();
        }
      });
    },
    render: function () {
      tb.update();
    }
  });
  paintConfidence(document.getElementById('reliability-switch').checked);
};

function addPreviews(data, active) {
  if (map.getLayer('preview-layer')) {
    map.removeLayer('preview-layer');
  }
  addLabels(data);

  map.addLayer({
    id: 'preview-layer',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (map, mbxContext) {
      mbxContext = map.getCanvas().getContext('webgl');
      window.tb = new Threebox(
        map,
        mbxContext, {
          defaultLights: true,
          antialias: true
        }
      );

      data.forEach(function (datum) {
        let baseCone = new THREE.Mesh(geometry, origMaterial);
        cone = tb.Object3D({
          obj: baseCone,
          units: 'meters'
        }).set({
          rotation: {
            x: -90,
            y: 0,
            z: 0
          }
        });

        cone.setCoords([datum.geometry.coordinates[0], datum.geometry.coordinates[1], 20]);
        // Bo: Attach properties to each cone.
        cone.userData.properties = datum.properties


        tb.add(cone);
        // tb.add(line);
      })

      let highlighted = [];

      //add mousing interactions
      map.on('click', 'data', function (e) {
        // Yufei: Make sure when click another venue, the report-issue panel cleared
        marker.remove();
        if (!(document.getElementById('report-issue').classList.contains('d-none'))) {
          document.getElementById('report-issue').classList.add('d-none');
        }
        // info-default panel on
        if (document.getElementById('info-default').classList.contains('d-none')) {
          document.getElementById('info-default').classList.remove('d-none');
          document.getElementById('ground-truth-btns').classList.remove('d-none');
        }

        // Clear old objects
        highlighted.forEach(function (h) {
          h.material = origMaterial;
        });
        highlighted.length = 0;

        // clear past inset map info
        document.getElementById('subMap-info').innerHTML = "";
        // document.getElementById('go-btn').innerHTML = " ";

        // calculate objects intersecting the picking ray
        let intersect = tb.queryRenderedFeatures(e.point)[0];
        let intersectionExists = typeof intersect == "object";

        // make sure the confidence level colors don't get overwritten
        paintConfidence(document.getElementById('reliability-switch').checked);

        // if intersect exists, highlight it
        if (intersect) {
          let nearestObject = intersect.object;
          nearestObject.material = materialOnClick;
          highlighted.push(nearestObject);
          current_category = nearestObject.parent.userData.properties.category;
          // toggleLeftPanelView('info-default');
          // document.getElementById('info').classList.toggle('leftCollapse');
        }

        // on state change, fire a repaint
        if (active !== intersectionExists) {
          active = intersectionExists;
          tb.repaint();
        }
      });
    },
    render: function () {
      tb.update();
    }
  });
  paintConfidence(document.getElementById('reliability-switch').checked);
}

function paintConfidence(isChecked) {
  let materials = [];
  let vcolors = chroma.scale('YlOrRd').colors(5);
  for (let i = 0; i < vcolors.length; i++) {
    materials.push(new THREE.MeshPhysicalMaterial({
      flatShading: true,
      color: vcolors[i],
      transparent: true,
      opacity: 0.8
    }));
  }


  if (isChecked) {

    tb.world.children.slice(1).forEach(feature => {
      if (feature.userData.properties.confidence.toLowerCase() == "not confident at all") {
        feature.children[0].material = materials[0];
      } else if (feature.userData.properties.confidence.toLowerCase() == "slightly confident") {
        feature.children[0].material = materials[1];
      } else if (feature.userData.properties.confidence.toLowerCase() == "somewhat confident") {
        feature.children[0].material = materials[2];
      } else if (feature.userData.properties.confidence.toLowerCase() == "fairly confident") {
        feature.children[0].material = materials[3];
      } else if (feature.userData.properties.confidence.toLowerCase() == "completely confident") {
        feature.children[0].material = materials[4];
      }
    })
  } else {
    tb.world.children.slice(1).forEach(feature => {
      feature.children[0].material = origMaterial;
    })
  }
  tb.repaint();
}

// this can be used to colorize the venue based on confidence level.
document.getElementById('reliability-switch').addEventListener('click', function () {
  paintConfidence(this.checked);
});

document.getElementById('reliability-switch').checked = true;


//Code filters in the missing venues and report
function createCodeCategories(data) {
  let dataSlice = [
    [],
    [],
    [],
    [],
    []
  ];
  Object.entries(data).forEach(([, value]) => {
    if (value.name == 'Entry Descriptors') {
      dataSlice[0].push(value.code);
    } else if (value.name == 'Clientele/User Descriptors') {
      dataSlice[1].push(value.code);
    } else if (value.name == 'Amenities/Services') {
      dataSlice[2].push(value.code);
    } else if (value.name == 'Caution/Restriction') {
      dataSlice[3].push(value.code);
    } else if (value.name == 'Organization/Association') {
      dataSlice[4].push(value.code);
    }
  });
  for (let data of dataSlice) {
    data.pop();
  }
  addCheckBox('#collapseEntry', dataSlice[0], 'add')
  addCheckBox('#collapseUser', dataSlice[1], 'add')
  addCheckBox('#collapseAmenity', dataSlice[2], 'add')
  addCheckBox('#collapseCaution', dataSlice[3], 'add')
  addCheckBox('#collapseOrganization', dataSlice[4], 'add')
  addCheckBox('#collapseEntryVerify', dataSlice[0], 'verify')
  addCheckBox('#collapseUserVerify', dataSlice[1], 'verify')
  addCheckBox('#collapseAmenityVerify', dataSlice[2], 'verify')
  addCheckBox('#collapseCautionVerify', dataSlice[3], 'verify')
  addCheckBox('#collapseOrganizationVerify', dataSlice[4], 'verify')
}

// check the box
function addCheckBox(id, data, type) {
  let mainCategory = document.querySelector(id);
  mainCategory.innerHTML = '';
  for (let descriptor of data) {
    let container = document.createElement('div');
    container.classList.add('form-check');
    let box = document.createElement('input');
    box.classList.add('form-check-input');
    box.setAttribute('type', 'checkbox');
    box.setAttribute('id', descriptor + type);
    box.setAttribute('value', descriptor);
    box.setAttribute('name', 'myCheckBoxes');
    let label = document.createElement('label');
    label.classList.add('form-check-label');
    label.setAttribute('for', descriptor + type);
    label.textContent = descriptor;
    container.appendChild(box);
    container.appendChild(label);
    mainCategory.appendChild(container);
  }
}

// Click the map will auto input an address for the user by geocoder
async function placeInput(place) {
  if (place.length == 4) {
    if (place[0].includes('St') || place[0].includes('Street') ||
      place[0].includes('Avenue') || place[0].includes('Ave') ||
      place[0].includes('Northwest') || place[0].includes('Northeast') ||
      place[0].includes('NW') || place[0].includes('NE') ||
      place[0].includes('Southwest') || place[0].includes('Southeast') ||
      place[0].includes('SW') || place[0].includes('SE')||
      place[0].includes('way')) {
      document.getElementById('location-api').value = '';
      document.getElementById('address-api').value = place[0].trim();
    } else {
      document.getElementById('address-api').value = '';
      document.getElementById('location-api').value = place[0].trim();
    }
    document.getElementById('city-api').value = place[1].trim();
    let state = place[2].trim().split(' ');
    document.getElementById('state-api').value = state[0].trim();
  } else if (place.length == 5) {
    document.getElementById('location-api').value = place[0].trim();
    document.getElementById('address-api').value = place[1].trim();
    document.getElementById('city-api').value = place[2].trim();
    let state = place[3].trim().split(' ');
    document.getElementById('state-api').value = state[0];
  }
}

////////////////////////////////////////////////////////////////////////////////////

// YEAR SLIDING
let yearSlider = document.getElementById('slider-bar');
yearSlider.addEventListener('input', function () {
  let selectedYear = parseInt(document.getElementById('slider-bar').value);
  document.getElementById('year-label').innerHTML = selectedYear;
});

yearSlider.addEventListener('change', async function () {
  let selectedYear = parseInt(document.getElementById('slider-bar').value);
  let selectedLocality = document.querySelector(".dropdown-item-checked").text.split(",")[0];
  updateMap(selectedYear, selectedLocality);
})

// // changes the label of the current selected year for the user to see
// document.getElementById("slider-bar").addEventListener("input", function (e) {
//   let selectedYear = document.getElementById('slider-bar').value;


// });


async function updateMap(selectedYear, selectedLocality, exclusion) {

  venues = await getVenues(selectedLocality);
  previews = await getPreviews(selectedLocality);
  let vidSet = new Set();
  let filteredYearData = venues.features.filter(function (feature) {
    // filters out duplicates to prevent rendering issues
    if  (feature.properties.year == selectedYear) {
      let vid = feature.properties.vid;
      if (!vidSet.has(vid)) {
        vidSet.add(vid);
        return true;
      }
    }
    return false;
  });

  addVenueLayer(map, toSecondaryGEOJSON(filteredYearData));
  current_venue_data = filteredYearData;

  removeAllLayers(exclusion);

  // load all codes
  let code_data = await allCodes();
  createCodeCategories(code_data);

  let defaultCodes = codeIncludes(code_data, selectedYear)
  code_div(defaultCodes, venues, selectedYear);
  let active = false;
  // three js 3D object

  //switch event
  if (current_code_filter.length > 0) {
    addVenues(on_Screen_Data_Venue, active);
  } else {
    addVenues(filteredYearData, active);
  }
  // create venue list and observation list
  makeLocalityList('locality-venues', venues, selectedYear);

  // If the venue layer was not added to the map, abort
  if (!map.getLayer('data')) {
    return;
  }
}

// MAP ON LOAD
map.on('style.load', async function () {
  let selectedYear = parseInt(document.getElementById('slider-bar').value);
  let selectedLocality = document.querySelector(".dropdown-item-checked").text.split(",")[0];
  updateMap(selectedYear, selectedLocality);
});

////////////////////////////////////////////////////
////////////////////////////////////////////////////
// when click on extrusion
map.on('click', 'year-block', function (e) {
  // processing years
  let yearList = JSON.parse(e.features[0].properties.years);
  let uniqueYears = [...new Set(yearList)];
  let stringYear = uniqueYears.join(",");

  // process data source
  let dataSourceList = JSON.parse(e.features[0].properties.datasource);
  let stringDataSource = dataSourceList.toString();

  // process date
  let dateList = JSON.parse(e.features[0].properties.dateadded);
  let dateData = dateList.toString();
  // process address
  let addressList = JSON.parse(e.features[0].properties.address);
  let uniqueAddress = [...new Set(addressList)];
  let stringUniqueAddress = uniqueAddress.join(",");

  // process descriptorlist
  let descriptorList = JSON.parse(e.features[0].properties.descriptorlist);
  let descriptorListString = descriptorList.toString();


  // popup
  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(`<p><b>
            ${e.features[0].properties.name}</b></br>
            Year:
            ${stringYear} </br>
            Data Source: ${stringDataSource} </br>
            Date added: ${dateData} </br>
            Address: ${stringUniqueAddress} </br>
            Descriptors: ${descriptorListString}
            </p>`)
    .addTo(map);
  // highlight extrusion on hover
  // display popup for location information of extrusion
  // might have to create API function call to retrieve all the possible years
  // once click on extrusion add left panel commands to display possible information?
})

// update block color on hover
let hoveredStateId = null;
map.on('mousemove', 'year-block', function (e) {
  if (e.features.length > 0) {
    if (hoveredStateId !== null) {
      map.setFeatureState({
        source: 'year-block',
        id: hoveredStateId
      }, {
        hover: false
      });
      map.setFeatureState({
        source: 'year-block-line',
        id: hoveredStateId
      }, {
        hover: false
      });
    }
    hoveredStateId = e.features[0].id;
    map.setFeatureState({
      source: 'year-block',
      id: hoveredStateId
    }, {
      hover: true
    });
    map.setFeatureState({
      source: 'year-block-line',
      id: hoveredStateId
    }, {
      hover: true
    });
  }
});

// change color of extrusion back after mouse leaves
map.on('mouseleave', 'year-block', () => {
  if (hoveredStateId !== null) {
    map.setFeatureState({
      source: 'year-block',
      id: hoveredStateId
    }, {
      hover: false
    });
    map.setFeatureState({
      source: 'year-block-line',
      id: hoveredStateId
    }, {
      hover: false
    });
  }
  hoveredStateId = null;
});

// trigger location information on click of location point of map
map.on('click', 'data', venueSliceLoad);
async function venueSliceLoad(e) {
  //left collapse control

  if (document.getElementById('info').classList.contains('leftCollapse')) {
    document.getElementById('info').classList.toggle('leftCollapse');
    toggleLeftPanelView('info-default');
  }

  if (!document.getElementById('add-observation').classList.contains('d-none')) {
    document.getElementById('add-observation').classList.add('d-none')
    //clearForm();
    toggleLeftPanelView('info-default');
  }

  // // clear 3-D year object
  if (typeof map.getLayer('year-block') !== "undefined") {
    map.removeLayer('year-block');
    map.removeSource('year-block');
  };

  if (typeof map.getLayer('year-block-line') !== "undefined") {
    map.removeLayer('year-block-line');
    map.removeSource('year-block-line');
  };

  if (typeof map.getLayer('buffer-point') !== "undefined") {
    map.removeLayer('buffer-point');
    map.removeSource('buffer-point');
  };

  // clear review box is open
  // let reviewBox = document.getElementById('type-review-box');
  // reviewBox.classList.add('d-none');

  // add all left panel actions (including zoom and adding data points)
  let feature = e.features[0];
  viewLeftPanel(feature);
  addLeftPanelActions(feature, marker);

  //add buffer
  //Bo: I temporarily hide the buffer since it locates at a wrong center. try smaller radius
  let turfPoint = turf.point([feature.geometry.coordinates[0] + 0.001, feature.geometry.coordinates[1]]);
  let buffer = turf.buffer(turfPoint, 100, {
    units: 'meters'
  });
  map.addLayer({
    id: 'buffer-point',
    source: {
      type: 'geojson',
      data: {
        "type": "FeatureCollection",
        "features": []
      }
    },
    type: "fill",
    paint: {
      'fill-color': 'red',
      'fill-opacity': 0.1
    }
  });

  map.getSource('buffer-point').setData(buffer);
  // indicate that this point is a venue
  let venueIndicator = document.getElementById('venue-indicator');
  if (feature.properties.v_id !== undefined) {
    venueIndicator.innerHTML = "this is a confirmed venue";
  } else {
    venueIndicator.innerHTML = '';
  };

  /*
  // add reviews
  // if add review button is clicked, display add review div box
  let addReview = document.getElementById('add-review-btn');
  addReview.addEventListener('click', () => {
    let reviewBox = document.getElementById('type-review-box');
    let textBox = document.getElementById('user-review-input');
    textBox.value = '';
    reviewBox.classList.remove('d-none');
  });

  let reviewCloseBtn = document.getElementById('cancel-review-btn');
  reviewCloseBtn.addEventListener('click', () => {
    let reviewBox = document.getElementById('type-review-box');
    let textBox = document.getElementById('user-review-input');
    textBox.value = '';
    reviewBox.classList.add('d-none');
  });
  */

  // update frontend with new divs for each comment
  // publish comment on click

  // ** test observation contains vsid information, first observation table does not
  let vid = parseInt(e.features[0].properties.vid);
  // Create underlying observation
  let observations = await getObservationsVID(vid, e.features[0].properties.year);

  let featureCoordinate = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
  let cubeCreate = await import('./addObservationCubes.js');
  cubeCreate.createCubes(observations.features, featureCoordinate);

  /*
  let reviewParent = document.getElementById('reviews-container');

  while (reviewParent.firstChild) {
    reviewParent.removeChild(reviewParent.lastChild);
  };

  document.getElementById('publish-btn').removeEventListener('click', submitNewReview);
  document.getElementById('publish-btn').addEventListener('click', submitNewReview);
  // get all comments of the location
  let reviewData = await getReviews(vsid);
  constructReviews(reviewData);
  // get all photos of the location by the google API
  // getEvidenceInfo(feature);
  */
};

/*
// helper function to submit new review
function submitNewReview(e) {
  let vid = parseInt(document.getElementById('vid-review').innerHTML);
  let submitCheck = document.getElementById('user-review-input').value;
  // check if
  if (/^\s*$/g.test(submitCheck)) {
    let alert = document.getElementById("alert-modal");
    let alertText = document.getElementById("alert-text");
    alertText.innerHTML = "Invalid comment. No text detected!";
    let alertModal = new bootstrap.Modal(alert);
    alertModal.show();
  } else {
    // add new review
    addNewReview(e, vid);
  }
};
*/

// go back button
document.getElementById('go-back-btn').addEventListener('click', function () {
  if (!(document.getElementById('info-default').classList.contains('d-none'))) {
    toggleLeftPanelView('all')
    if (!document.getElementById('info').classList.contains('leftCollapse')) {
      document.getElementById('info').classList.toggle('leftCollapse');
    }
  }

  if (typeof map.getLayer('selectedMarker') !== "undefined") {
    marker.remove();
    map.removeLayer('selectedMarker');
    map.removeSource('selectedMarker');
  };

  if (typeof map.getLayer('buffer-point') !== "undefined") {
    map.removeLayer('buffer-point');
    map.removeSource('buffer-point');
  };

  if (typeof map.getLayer('year-block') !== 'undefined') {
    // clear 3-D year object
    map.removeLayer('year-block');
    map.removeSource('year-block');
  };

  if (typeof map.getLayer('year-block-line') !== 'undefined') {
    // clear 3-D year object
    map.removeLayer('year-block-line');
    map.removeSource('year-block-line');
  };
});

document.getElementById('go-back-btn2').addEventListener('click', function () {
  if (!(document.getElementById('add-observation').classList.contains('d-none'))) {

    toggleLeftPanelView('all');
    document.getElementById('info').classList.toggle('leftCollapse');
    document.getElementById('add-observation').classList.toggle('d-none');
    let inputs = document.querySelectorAll('input');
    for (let input of inputs) {
      input.value = '';
    }
    let yearSlider = document.getElementById('current-year-value-api');
    let yearText = document.getElementById('year-text-label');
    let checkboxes = document.querySelectorAll('input[name=myCheckBoxes]:checked');
    for (let box of checkboxes) {
      box.checked = false;
    }
    yearSlider.value = 2014;
    yearText.textContent = 'Year: ' + yearSlider.value;
    document.getElementById('slider-bar').value = document.getElementById('year-label').textContent;

  }
})

// Change the cursor to a pointer when the it enters a feature in the 'circle' layer.
map.on('mouseenter', 'data', function () {
  map.getCanvas().style.cursor = 'pointer';
});
// Change it back to a pointer when it leaves.
map.on('mouseleave', 'data', function () {
  map.getCanvas().style.cursor = '';
});

map.on('click', function (e) {
  //click on the map to hide the locality and/or the code filter menus.
  let localityList = document.getElementById('localityList');
  localityList.classList.add('d-none');

  let codeDescriptorList = document.getElementById('codeDescriptorList');
  codeDescriptorList.classList.add('d-none');

  // geocoding process.
  if (!document.getElementById('add-observation').classList.contains('d-none')) {
    // add long lat for user
    document.getElementById('long-api').value = e.lngLat.lng;
    document.getElementById('lat-api').value = e.lngLat.lat;

    $.get(
      "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
      e.lngLat.lng + "," + e.lngLat.lat + ".json?access_token=" + mapboxgl.accessToken,
      function (data) {
        let place = data.features[0].place_name.split(',');
        placeInput(place);
      }
    ).fail(function (jqXHR, textStatus, errorThrown) {
      alert("There was an error while geocoding: " + errorThrown);
    });
  }
});


// Return function on report an issue panel
document.getElementById('return-btn').addEventListener('click', function () {
  marker.remove();
  if (!(document.getElementById('report-issue').classList.contains('d-none'))) {
    document.getElementById('report-issue').classList.add('d-none');
  }
  document.getElementById('info-default').classList.remove('d-none');
  document.getElementById('ground-truth-btns').classList.remove('d-none');
});

// Add a new observation button - remove corresponding layers
document.getElementById('add-observation-container').addEventListener('click', function () {
  if (isLoggedIn()) {
    if (map.getLayer('buffer-point')) {
      map.removeLayer('buffer-point');
      map.removeSource('buffer-point');
    }
    // remove 3D shapes
    if (map.getLayer('year-block')) {
      map.removeLayer('year-block');
      map.removeSource('year-block');
    }

    if (map.getLayer('year-block-line')) {
      map.removeLayer('year-block-line');
      map.removeSource('year-block-line');
    }
  }
});
