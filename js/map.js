mapboxgl.accessToken = config.accessToken;

let current_category = ''; // record the category of current clicked venue
let current_confidence = ''; // record the confidence level of current clicked venue
let current_observation_data; // record the overall observation data of selected year
let current_venue_data; // record the overall venue data of selected year
let current_code_filter = []; // tracking the filters user selected
let on_Screen_Data_Venue; // venue data with the filter
let on_Screen_Data_Observe; // observation data with the filter
let venue_status = true; // if venue layer is on
let legend_panel = true; // if legend panel is on.
let observation_status = false; // if observation layer is on

const localities = {
  'seattle': {
    center: [-122.3321, 47.6062],
    zoom: 14
  },
  'atlanta': {
    center: [-84.3880, 33.7490],
    zoom: 14
  },
  'nashville': {
    center: [-86.7816, 36.1627],
    zoom: 14
  },
  'cleveland': {
    center: [-81.6944, 41.4993],
    zoom: 14
  }

};


// initialize geometry and material of our cube object
const geometry = new THREE.ConeGeometry(15, 40, 64);
const origMaterial = new THREE.MeshPhysicalMaterial({
  flatShading: true,
  color: '#D3B1C2',
  transparent: true,
  opacity: 0.6
});

const transMaterial = new THREE.MeshPhysicalMaterial({
  flatShading: true,
  color: '#D3B1C2',
  transparent: true,
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

const cubeGeometry = new THREE.BoxGeometry(30, 30, 30);
const lineGeometry = new THREE.CylinderGeometry(1, 1, 35, 32);


let map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/light-v10', // style URL
  center: [-122.33502, 47.61497], // starting position [lng, lat]
  zoom: 14, // starting zoom
  pitch: 76,
  bearing: -10.8,
  logoPosition: 'bottom-right',
  attributionControl: false,
  antialias: true,
  hash: true
});

let subMap = new mapboxgl.Map({
  container: 'subMap', // container ID
  style: 'mapbox://styles/mapbox/light-v10', // style URL
  center: [-122.33502, 47.61497],
  zoom: 12, // starting zoom
  pitch: 80,
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
    placeholder: "Search a local place...",
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
async function getReviews(vid) {
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
  let timeOutID = setTimeout(function () {
    reviewCheck.classList.add('d-none')
  }, 3000);
  timeOutID;
}

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
};

// Creating polygon geojson file for inset map view
function toPolygonGEOJSON(data) {
  let feature_list = [];
  let options = {
    steps: 100,
    units: 'kilometers'
  };
  let color;
  let polygonRadius;
  let radiusList = [0.2, 0.195, 0.19, 0.185, 0.18]
  let colorCode = ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026']
  for (const element of data) {
    let coordinates = element.geometry.coordinates.slice();
    if (element.properties.year < 1975) {
      color = colorCode[0]
      polygonRadius = radiusList[0]
    } else if (element.properties.year < 1985) {
      color = colorCode[1]
      polygonRadius = radiusList[1]
    } else if (element.properties.year < 1995) {
      color = colorCode[2]
      polygonRadius = radiusList[2]
    } else if (element.properties.year < 2005) {
      color = colorCode[3]
      polygonRadius = radiusList[3]
    } else {
      color = colorCode[4]
      polygonRadius = radiusList[4]
    }
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
        'height': (element.properties.year - 1950) * 10,
        'base': 0,
        'color': color,
      }
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

// it's a toGEOJSON function for data not fitting into the first toGEOJSON function
function toSecondaryGEOJSON(data) {
  let feature_list = [];
  // for loop
  for (let i = 0; i < data.length; i++) {
    let temp = {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [data[i].geometry.coordinates[0], data[i].geometry.coordinates[1]]
      },
      "properties": getSecondaryProperties(data[i])
    }
    feature_list.push(temp);
    //console.log(getProperties(data[i]).placetype);
    // console.log(getProperties(data[i]).confidence);

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

  // if (map.getLayer('venue-slice-cones')) {
  //   map.removeLayer('venue-slice-cones');
  // };
  // if (map.getLayer('poi-labels')) {
  //   map.removeLayer('poi-labels');
  //   map.removeSource('venues');
  // };

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

// add accordion layer - for venues and observations
function addObservationLayer(map, data) {

  let features = data.features;
  let test = {
    'type': 'FeatureCollection',
    'features': features.map((location, index) => ({
      'type': 'Feature',
      'properties': {
        'height': 50,
        'base': 0
      },
      'geometry': {
        'type': 'Polygon',
        'coordinates': turf.bboxPolygon(turf.square(turf.bbox(turf.circle(location.geometry.coordinates, 0.01, {
          steps: 64
        })))).geometry.coordinates
      }
    }))
  };

  map.addLayer({
    'id': 'observations',
    'type': 'fill-extrusion',
    'source': {
      'type': 'geojson',
      'data': test,
      generateId: true,
      'tolerance': 0
    },
    'layout': {
      'visibility': 'none'
    },
    'paint': {
      'fill-extrusion-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        'red',
        'pink'
      ],
      'fill-extrusion-base': {
        'type': 'identity',
        'property': 'base'
      },
      'fill-extrusion-height': {
        'type': 'identity',
        'property': 'height'
      },
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': false,
    }
  });

};

// basemap switching/styling
var layerList = document.getElementsByClassName('layers-input-container');

function switchLayer(layer) {
  var layerId = layer.target.id;
  map.setStyle('mapbox://styles/mapbox/' + layerId);

  // adjust slider text color when changing basemaps
  // document.getElementById('slider-time').setAttribute("style", "color: black;");
  var layers = map.getStyle().layers;
};

// assign switch layer function for all radio button inputs
for (var i = 0; i < layerList.length; i++) {
  layerList[i].onclick = switchLayer;
};

function removeAllLayers() {
  let layers = ['observation-cubes', 'nearby-observations', 'buffer-point', 'year-block', 'poi-labels', 'venue-slice-cones'];
  let sources = ['venues'];
  for (let layer of layers) {
    if (map.getLayer(layer)) {
      map.removeLayer(layer);
    };
  }
  for (let source of sources) {
    if (map.getSource(source)) {
      map.removeSource(source);
    };
  }
}

subMap.on('load', function(){
  viewLeftPanel;
})
// function slide-in left panel
function viewLeftPanel(e) {
  let filteredLocalData = venues.features.filter(function (feature) {
    return feature.properties.vid == e.properties.vid
  });

  // parse the codes to increase readability
  let codes = infoNullCheck(e.properties.descriptorlist);
  if (typeof(codes) == 'string') {
    let codeString = "";
    for (const element of codes) {
      if (element !== '[' && element !== '"' && element !== '.' && element !== ']' && element !== "'") {
        codeString += element;
      }
    }
    codes = codeString.split(',');
  }
  for (let i = 0; i < codes.length; i++) {
    codes[i] = codes[i].replaceAll('\'', '');
  }
  document.getElementById('code').innerHTML = '';
  for (const element of codes){
    let code = document.createElement("button");
    code.innerText = element;
    code.className = 'descriptor';
    code.addEventListener('click', function() {
      document.getElementById('clear-button').click();
      document.getElementById(element).click();
    });
    document.getElementById('code').appendChild(code);
  }

  // left panel location information
  document.getElementById('name').innerHTML = infoNullCheck(e.properties.observedvenuename);
  document.getElementById('address').innerHTML = infoNullCheck(e.properties.address);
  document.getElementById('year-info').innerHTML = infoNullCheck(e.properties.year);
  document.getElementById('city').innerHTML = infoNullCheck(e.properties.city);
  document.getElementById('state').innerHTML = infoNullCheck(e.properties.state);

  //vid for comment
  document.getElementById('vid-review').innerHTML = e.properties.vid;

  // Inset map, extrusion, and functions
  // subMap.on('load', function () {
  subMap.setCenter(e.geometry.coordinates);
  if (subMap.getLayer('year-extrusion')) {
    subMap.removeLayer('year-extrusion');
    subMap.removeSource('dataByYear');
  };
  subMap.addSource('dataByYear', {
    'type': 'geojson',
    'data': toPolygonGEOJSON(filteredLocalData)
  })
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
      'fill-extrusion-opacity': 0.7
    }
  })
  let yearList = [];
  let address = [];
  let timelineOfAddress = {};
  let referenceList = {};
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
  subMap.on('click', 'year-extrusion', function (e) {
    let button = document.createElement('button');
    button.setAttribute('id', 'go-btn');
    button.setAttribute('type', 'button');
    button.classList.add('btn');
    button.classList.add('btn-primary');
    button.classList.add('my-3');
    button.textContent = 'Open the venue info in ' + e.features[0].properties.year + '.';
    let vsid = e.features[0].properties.vsid
    button.addEventListener('click', function() {
      goToButton(vsid);
    })
    let container = document.createElement('div');
    // container.innerHTML = "<strong>Address: </strong>" + e.features[0].properties.name + '<br>' + '<strong>Clicked Year: </strong>' + e.features[0].properties.year + '<br>' + referenceList[e.features[0].properties.year];
    container.innerHTML = "<strong>Address: </strong>" + e.features[0].properties.name + '<br>'  + referenceList[e.features[0].properties.year];
    container.appendChild(button);
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setDOMContent(container)
      .addTo(subMap);
  })
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
};
// left panel functionalities (validate observation marker view, selected marker view, map zoom to selected point)
async function addLeftPanelActions(feature, marker, e) {
  sessionStorage.clear();
  let coordinates = feature.geometry.coordinates.slice();
  //for those in the list (no specific latlng was found, the program should skip the following lines.)
  try {
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    let point = feature.geometry.coordinates;
    point[0] -= 0.001
    map.flyTo({
      center: point,
      zoom: 16.5,
      speed: 0.3,
      pitch: 75,
      bearing: -25,
      essential: true
    });

  } catch (error) {
    console.log(error);
  }

  // if "report an issue" button is clicked, display movable marker
  let reportIssue = document.getElementById('report-issue-btn');
  reportIssue.addEventListener('click', async function () {
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
      toggleLeftPanelView('report-issue');
      document.getElementById('ground-truth-btns').classList.toggle('d-none');
      if (document.getElementById('info').classList.contains('leftCollapse')) {
        document.getElementById('info').classList.remove('leftCollapse')
      }
      document.getElementById('alert-cls-btn').addEventListener('click', function() {
        marker.remove();
      })
    }
  });
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

    let localityName = locality[0].charAt(0).toUpperCase() + locality[0].slice(1);
    if (localityName == "Seattle") {
      localityItem.innerHTML = '<a class="dropdown-item dropdown-item-checked" href="#">' + localityName + '</a>';
    } else {
      localityItem.innerHTML = '<a class="dropdown-item" href="#">' + localityName + '</a>';
    }

    localityList.appendChild(localityItem);
    localityItem.addEventListener('click', async function handleClick(event) {

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
        pitch: 75,
        bearing: -25,
        essential: true
      });

      localityList.classList.add('d-none');
      localityItem.querySelector("a").classList.add("dropdown-item-checked");


      let selectedLocality = this.innerText;
      let selectedYear = parseInt(document.getElementById('slider-bar').value);

      updateMap(selectedYear, selectedLocality);


    });

  });

}

// create and style all incoming reviews from API request
function constructReviews(reviewData) {
  let reviewParent = document.getElementById('reviews-container');

  for (let element of reviewData) {
    let reviewDiv = document.createElement('div');
    reviewDiv.innerHTML = element.content;
    reviewDiv.classList.add('review-box');
    reviewParent.append(reviewDiv);
  }
}
// add 3-D extrusions
function addExtrusions(feature, e) {
  // get the data points that stack on top of each other within the selected year range
  // let layerData = map.queryRenderedFeatures([e.point.x, e.point.y], {
  //   layers: ['data']
  // });
  let coordinates = feature.geometry.coordinates.slice();
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  };

  // sort data by year (from lowest to highest) if layerData detects more than one
  // if (layerData.length > 1) {
  //   layerData.sort((a, b) => {
  //     return parseFloat(a.properties.year) - parseFloat(b.properties.year);
  //   });
  // };

  const polygonRadius = 0.02;
  let options = {
    steps: 100,
    units: 'kilometers'
  };

  let scaleTest = chroma.scale('OrRd').colors(12);
  let yearBlockData = {
    // layerData.map((location, index) => (
    'type': 'Feature',
    'properties': {
      'name': feature.properties.observedvenuename,
      'year': feature.properties.year,
      'height': 75,
      // 'height': (((index == 0) ? 50 : (index + 1) * 150 - 45) + 145),
      // 'base': ((index == 0) ? 50 : (index + 1) * 150 - 10),
      'base': 50,
      'paint': scaleTest[0]
    },
    'geometry': {
      'type': 'Polygon',
      'coordinates': turf.circle(coordinates, polygonRadius, options).geometry.coordinates
    },
    'id': feature.id
    // ))
  };
  map.addLayer({
    'id': 'year-block',
    'type': 'fill-extrusion',
    'source': {
      'type': 'geojson',
      'data': yearBlockData,
      generateId: true,
      'tolerance': 0
    },
    'paint': {
      'fill-extrusion-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        'red',
        'pink'
      ],
      'fill-extrusion-base': {
        'type': 'identity',
        'property': 'base'
      },
      'fill-extrusion-height': {
        'type': 'identity',
        'property': 'height'
      },
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': false,
    }
  });
};


// add div for the codes corresponding to selected year on the map
function code_div(codes, venueSlices, observedData, year) {
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

    if (!codeNames.includes(code.name)) {
      codeNames.push(code.name);

      let codeSubCategory = document.createElement('li');
      codeSubCategory.classList.add("metaDescriptor");

      codeSubCategory.innerHTML = '<a class="dropdown-item" href="#">' + code.name + '</a>';


      let codeSubCategoryMenu = document.createElement('ul');
      codeSubCategoryMenu.setAttribute("id", code.name.replace(/\s+/g, '').toLowerCase());
      codeSubCategoryMenu.classList.add("dropdown-menu");
      codeSubCategoryMenu.classList.add("dropdown-submenu");
      // codeSubCategoryMenu.classList.add("dropdown-div");

      codeSubCategory.appendChild(codeSubCategoryMenu);

      codeParent.appendChild(codeSubCategory);

    }


    let categoryMenu = document.getElementById(code.name.replace(/\s+/g, '').toLowerCase());
    let codeItem = document.createElement('li');

    codeItem.innerHTML = '<a class="dropdown-item" href="#">' + code.code + '</a>';
    codeItem.id = code.code;


    ////////////////
    // for each code_div add event listener on click to add filter features of the map
    codeItem.addEventListener('click', function () {
      if (current_code_filter.length >0) {
        makeAlert('You can only select one filter at one time');
      } else {
        codeParent.classList.add('d-none');
        // map.setFilter('data', ['in', code.code, ['get', 'codedescriptorlist']]);

        ///////////////////////////////////////////////////////////////////////////////////////////
      //remove 3D layer

      let result = [];
      let resultObserve = []
      venueSlices.features.filter(function (feature) {
        if (feature.properties.year == year){
          dlist = feature.properties.descriptorlist;
          if (Array.isArray(dlist)){
            for (i = 0; i <  dlist.length; i++) {
              if (dlist[i].includes(code.code)) {
                result.push(feature);
              }
            }
          }
        }
      });
      addCones(result, false);
      observedData.features.filter(function (feature) {
        if (feature.properties.year == year){
          dlist = feature.properties.descriptorlist;
          if (Array.isArray(dlist)){
            for (i = 0; i <  dlist.length; i++) {
              if (dlist[i].includes(code.code)) {
                resultObserve.push(feature);
              }
            }
          }
        }
      });

      on_Screen_Data_Venue = result;
      on_Screen_Data_Observe = resultObserve;
      if (map.getLayer('venue-slice-cones')) {
        map.removeLayer('venue-slice-cones');
      };
      if (map.getLayer('observation-cubes')) {
        map.removeLayer('observation-cubes');
      }
      if (map.getLayer('poi-labels')) {
        map.removeLayer('poi-labels');
        map.removeSource('venues');
      };
      if (venue_status && observation_status) {
        addCubes(resultObserve, false)
        addCones(result, false);
      } else if (venue_status) {
        addCones(result, false)
      } else if (observation_status) {
        addCubes(resultObserve, false)
      }
      ///////////////////////////////////////////////////////////////////////////////////////////
        document.getElementById("code-filter-btn").innerText = 'Current Filter: ' + codeItem.id;
        document.getElementById("clear-button").innerHTML = '<a class="dropdown-item" title="Clear all selected filters" href="#"> The filter <span id="applied-filter">' + code.code + '</span> is applied. \n  </br> Click here to remove this filter. </a>';
        }
      })


    categoryMenu.appendChild(codeItem);

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

    // map.setFilter('data', undefined);
    // // map filter of single year selected by the user
    // map.setFilter('data', ["==", ['number', ['get', 'year']], year]);
    // // let selectionDiv = document.getElementById('dropdown-container');
    // // selectionDiv.classList.toggle('d-none');
    // // remove 3D layer
    // // if (map.getLayer('venue-slice-cones')) {
    // //   map.removeLayer('venue-slice-cones');
    // // };
    // // if (map.getLayer('poi-labels')) {
    // //   map.removeLayer('poi-labels');
    // //   map.removeSource('venues');
    // // };
    // removeAllLayers();
    // let onScreenData = venueSlices.features.filter(function (feature) {
    //   return feature.properties.year == year
    // });
    // console.log(onScreenData);
    // addCones(onScreenData, false);
    if (map.getLayer('venue-slice-cones')) {
      map.removeLayer('venue-slice-cones');
    };
    if (map.getLayer('observation-cubes')) {
      map.removeLayer('observation-cubes');
    }
    if (map.getLayer('poi-labels')) {
      map.removeLayer('poi-labels');
      map.removeSource('venues');
    };

    if (venue_status && observation_status) {
      addCones(current_venue_data, false);
      addCubes(current_observation_data, false);
    } else if (venue_status) {
      addCones(current_venue_data, false);
    } else if (observation_status) {
      addCubes(current_observation_data, false);
    }
  });

  codeParent.appendChild(divider);
  codeParent.appendChild(clear);

  ///////////////////////////////clear function///////////////////////////////////////////


}

// obtain damron codes of a corresponding year
function codeIncludes(codeData, year) {
  let result = {};
  // Obtain damron codes of corresponding year
  for (let codeInfo in codeData) {
    let codeObj = codeData[codeInfo];
    if (codeObj.years.includes(year.toString())) {
      result[codeInfo] = codeObj;
    }
  }
  return result;
}


// getStreetView
// Function that uses the Google Street View API to obtain a default streetview of location
// Requests uses location longitude and latitude to find the picture
// Parameters:
//  feature: js object that contains complete data of clicked location
function getEvidenceInfo(feature) {

  let streetviewDiv = document.getElementById('streetview-evidence');
  streetviewDiv.setAttribute('href', 'http://maps.google.com/maps?q=&layer=c&cbll='+ feature.geometry.coordinates[1] +','+ feature.geometry.coordinates[0] +'&cbp=');

  let photoDiv = document.getElementById('image-evidence');
  try {
  photoDiv.setAttribute('href', 'https://www.google.com/search?tbm=isch&q=venue '+ feature.properties.observedvenuename + ' in ' + feature.properties.locality + ', ' + feature.properties.state + ' in the year ' + feature.properties.year);
  } catch (err) {
    photoDiv.setAttribute('href', 'https://www.google.com/search?tbm=isch&q=venue '+ feature.properties.observedvenuename + ' in ' + feature.properties.locality +  ' in the year ' + feature.properties.year);

  }

  let tweetsDiv = document.getElementById('tweets-evidence');
  tweetsDiv.setAttribute('href', 'https://twitter.com/search?q='+ feature.properties.observedvenuename +'%20geocode%3A'+feature.geometry.coordinates[1]+'%2C'+feature.geometry.coordinates[0]+'%2C.1km&src=typed_query&f=top');

}
function getStreetView(feature) {
  let imgParent = document.getElementById('venue-img-container');
  let location = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];

  let imageURL = "https://maps.googleapis.com/maps/api/streetview?";
  let imgParams = new URLSearchParams({
    location: location[0] + ", " + location[1],
    size: "1280x720",
    fov: 90,
    heading: 70,
    pitch: 0,
    // API key linked to personal account currently (GOOGLE CLOUD CONSOLE)
    key: "AIzaSyC7zg5Rb4UJNKsiXIol35wzC0uZmHddj0Q"
  });

  let fetchURL = imageURL + imgParams.toString();

  fetch(fetchURL)
    .then(response => response.blob())
    .then(imageBlob => {
      // remove all current/previous loaded images
      while (imgParent.firstChild) {
        imgParent.removeChild(imgParent.firstChild);
      }
      let imgChild = document.createElement('img');
      let imageObjectURL = URL.createObjectURL(imageBlob);
      imgChild.src = imageObjectURL;
      imgParent.appendChild(imgChild);
    })

}

// getPhotos
// Function that utilizes the Google Maps and Places Javascript Library to obtain a default image of a location
// Requests uses a location bias and location names to search (similar to a google search)
// Parameters:
//  feature: javascript object that contains complete data of a clicked location

function getPhotos(feature) {
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
};

function setImgURL(service, placeId) {
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
};


// add names to the cones
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
      let PlaceType = document.createElement('div');
      Name.classList.add('col');
      PlaceType.classList.add("col", "col-sm-3");

      let placetype = type;

      Name.innerHTML = element.properties.observedvenuename;
      PlaceType.innerHTML = placetype;

      rowDiv.appendChild(Name);
      rowDiv.appendChild(PlaceType);

      localityParent.appendChild(rowDiv);
      rowDiv.addEventListener('click', function () {

        viewLeftPanel(localityFeatures[i]);
        addLeftPanelActions(localityFeatures[i], marker);
        getEvidenceInfo(localityFeatures[i]);
        // getStreetView(localityFeatures[i]);
        // addExtrusions(localityFeatures[i]);
        if (document.getElementById('info-default').classList.contains('d-none')) {
          let collapseState = document.getElementById('info').classList.toggle('leftCollapse');

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

function addCones(data, active) {
  if (map.getLayer('venue-slice-cones')) {
    map.removeLayer('venue-slice-cones');
  }
  if (data.length == 0) {
    document.getElementById("year-notes").innerHTML = "No venues from this locale of this year has been found in our database. If you know any venue does not shown on this database, please help us improve. "
  } else {
    document.getElementById("year-notes").innerHTML = "";
  }

  addLabels(data);

  map.addLayer({
    id: 'venue-slice-cones',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (map, mbxContext) {
      if (!map.getLayer('observation-cubes')) {
        mbxContext = map.getCanvas().getContext('webgl');
        window.tb = new Threebox(
          map,
          mbxContext, {
            defaultLights: true
          }
        );
      }

      // let geometrySup = new THREE.CylinderGeometry(1, 1, 80, 32);
      // let materialSup = new THREE.MeshBasicMaterial({
      //   flatShading: true,
      //   color: '#8bd5ee',
      //   transparent: true,
      //   opacity: 0.7
      // });

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
        // console.log(datum.properties.placetype);
        cone.userData.properties = datum.properties


        tb.add(cone);
        // tb.add(line);
      })



      let highlighted = [];

      //add mousing interactions
      // @jakobzhao: just confine it to the data layer? map.on('click',  function (e) {???
      // @jakobzhao:  'venue-slice-cones' is added by Bo.
      map.on('click', 'data', function (e) {
        // Yufei: Make sure when click another venue, the report-issue panel cleared
        marker.remove();
        if (!(document.getElementById('report-issue').classList.contains('d-none'))) {
          document.getElementById('report-issue').classList.add('d-none');
        }
        // info-default panel on
        if (document.getElementById('info-default').classList.contains('d-none')) {
          document.getElementById('info-default').classList.remove('d-none');
        }

        // Clear old objects
        highlighted.forEach(function (h) {
          h.material = origMaterial;
        });
        highlighted.length = 0;

        // calculate objects intersecting the picking ray
        let intersect = tb.queryRenderedFeatures(e.point)[0];
        let intersectionExists = typeof intersect == "object";

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
    render: function (gl, matrix) {
      tb.update();
    }
  });
};

function addCubes(data, active) {
  // if (data.length == 0) {
  //   document.getElementById("year-notes").innerHTML = "No observations from this locale of this year has been found in our database. If you know any venue does not shown on this database, please help us improve. "
  // } else {
  //   document.getElementById("year-notes").innerHTML = "";
  // }
  //addLabels(data);
  if (map.getLayer('observation-cubes')) {
    map.removeLayer('observation-cubes');
  };

  map.addLayer({
    id: 'observation-cubes',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (map, mbxContext) {
      if (!map.getLayer('venue-slice-cones')) {
        mbxContext = map.getCanvas().getContext('webgl');
        window.tb = new Threebox(
          map,
          mbxContext, {
            defaultLights: true
          }
        );
      }
      data.forEach(function (datum) {
        let baseCube = new THREE.Mesh(cubeGeometry, origMaterial);
        let baseLine = new THREE.Mesh(lineGeometry, transMaterial);
        cube = tb.Object3D({
            obj: baseCube,
            units: 'meters'
          })
          .set({
            rotation: {
              x: 0,
              y: 0,
              z: 0
            }
          });
        line = tb.Object3D({
            obj: baseLine,
            units: 'meters'
          })
          .set({
            rotation: {
              x: 90,
              y: 0,
              z: 0
            }
          });


        line.setCoords([datum.geometry.coordinates[0], datum.geometry.coordinates[1], 18]);
        //the third parameter indicates the height of the cube.
        cube.setCoords([datum.geometry.coordinates[0], datum.geometry.coordinates[1], 55.2]);
        cube.userData.properties = datum.properties;
        tb.add(cube);
        tb.add(line);
      })

    },
    render: function (gl, matrix) {
      tb.update();
    }
  });
};

// this can be used to colorize the venue based on confidence level.
document.getElementById('reliability-switch').addEventListener('click', function () {

  let materials = [];
  let vcolors = chroma.scale('YlOrRd').colors(5);
  for (let i = 0; i < vcolors.length; i++) {
    materials.push(new THREE.MeshPhysicalMaterial({
      flatShading: true,
      color: vcolors[i],
      transparent: true,
      opacity: 0.4
    }));
  }


  if (this.checked) {

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

});




// document.getElementById('confidence-switch').addEventListener('click', function () {

//   if (this.checked) {

//     tb.world.children.forEach(feature => {
//       if (feature.type == 'Group') {
//         feature.children[0].material.color.set("green");
//         console.log(feature.userData.properties.placetype);
//       }

//     })
//   } else {

//     tb.world.children.forEach(feature => {
//       if (feature.type == 'Group') {
//         feature.children[0].material.color.set("red");
//       }
//     })
//   }

//   tb.repaint();

// });


// function displayNearbyObservations(obsData, e) {
//   let observationData = obsData.features;
//   let selectedData = e.features[0];

//   let coordinates = selectedData.geometry.coordinates.slice();
//   while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
//     coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
//   };

//   // the radius of the searching buffer
//   const polygonRadius = 0.05;
//   let options = {
//     steps: 100,
//     units: 'miles'
//   };

//   const circleRadius = 0.01;
//   let circleOptions = {
//     steps: 100,
//     units: 'miles'
//   };

//   let points = [];
//   observationData.forEach((element, index) => {
//     points.push(element.geometry.coordinates);
//   });

//   let turfPoints = turf.points(points);
//   let searchWithin = turf.circle(coordinates, polygonRadius, options);
//   let result = turf.pointsWithinPolygon(turfPoints, searchWithin);
//   // for each point that is within the circle boundary
//   result.features.forEach((element, index) => {
//     element.geometry = turf.circle(element.geometry.coordinates, circleRadius, circleOptions).geometry;
//     element.properties = {
//       'height': 75,
//       'base': 50,
//       // 'height': (((index == 0) ? 50 : (index + 1) * 150 - 45) + 145),
//       // 'base': ((index == 0) ? 50 : (index + 1) * 150 - 10),
//       'paint': 'green'
//     }
//   });

//   map.addLayer({
//     id: 'nearby-observations',
//     type: 'fill-extrusion',
//     source: {
//       type: 'geojson',
//       data: {
//         "type": "FeatureCollection",
//         "features": []
//       },
//       tolerance: 0
//     },
//     paint: {
//       'fill-extrusion-color': [
//         'case',
//         ['boolean', ['feature-state', 'hover'], false],
//         'red',
//         'pink'
//       ],
//       'fill-extrusion-base': {
//         'type': 'identity',
//         'property': 'base'
//       },
//       'fill-extrusion-height': {
//         'type': 'identity',
//         'property': 'height'
//       },
//       'fill-extrusion-opacity': 1,
//       'fill-extrusion-vertical-gradient': false,
//     }
//   });
//   map.getSource('nearby-observations').setData(result);
// };



//Code filters in the missing venues and report
function createCodeCategories(data) {
  let dataSlice = [
    [],
    [],
    [],
    [],
    []
  ];
  Object.entries(data).forEach(([key, value]) => {
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
  // console.log(dataSlice);
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
      place[0].includes('SW') || place[0].includes('SE')) {
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

// switch cube and cone layers, require coordination
// let obserLayer = document.getElementById('observe-switch')
// let venueLayer = document.getElementById('venue-switch');
let venueCheckbox = document.getElementById('venue-flexSwitchCheckChecked');
// let obserCheckbox = document.getElementById('observe-flexSwitchCheckChecked');
// obserLayer.addEventListener('click', function (e) {
//   if (map.getLayer('poi-labels')) {
//     map.removeLayer('poi-labels');
//     map.removeSource('venues');
//   }
//   if (obserCheckbox.checked != true) {
//     observation_status = false;
//     if (map.getLayer('observation-cubes')) {
//       map.removeLayer('observation-cubes');
//     }
//     if (venue_status) {
//       if (map.getLayer('venue-slice-cones')) {
//         map.removeLayer('venue-slice-cones');
//       }
//       if (current_code_filter.length > 0) {
//         addCones(on_Screen_Data_Venue, false);
//       } else {
//         addCones(current_venue_data, false);
//       }
//     }
//     //addCones(current_venue_data, false);
//   } else {
//     // observation_status = true;
//     // if (map.getLayer('observation-cubes')) {
//     //   map.removeLayer('observation-cubes');
//     // }
//     // if (current_code_filter.length > 0) {
//     //   addCubes(on_Screen_Data_Observe, false);
//     // } else {
//     //   addCubes(current_observation_data, false);
//     // }

//   }
// });

venueCheckbox.addEventListener('click', function (e) {

  
  if (map.getLayer('poi-labels')) {
    map.removeLayer('poi-labels');
    map.removeSource('venues');
  }
  if (venueCheckbox.checked != true) {
    venue_status = false;
    if (map.getLayer('venue-slice-cones')) {
      map.removeLayer('venue-slice-cones');
    }
    if (observation_status) {
      if (map.getLayer('observation-cubes')) {
        map.removeLayer('observation-cubes');
      }
      if (current_code_filter.length > 0) {
        addCubes(on_Screen_Data_Observe, false);
      } else {
        addCubes(current_observation_data, false);
      }
    }
  } else {
    venue_status = true;
    if (map.getLayer('venue-slice-cones')) {
      map.removeLayer('venue-slice-cones');
    }
    if (current_code_filter.length > 0) {
      addCones(on_Screen_Data_Venue, false);
    } else {
      addCones(current_venue_data, false);
    }
  }

  // e.preventDefault();
  e.stopPropagation();
  console.log(e.target.id);


})

////////////////////////////////////////////////////////////////////////////////////




// YEAR SLIDING
let yearSlider = document.getElementById('slider-bar');
yearSlider.addEventListener('input', function (e) {
  let selectedYear = parseInt(document.getElementById('slider-bar').value);
  document.getElementById('year-label').innerHTML = selectedYear;
});

yearSlider.addEventListener('change', async function (e) {
  let selectedYear = parseInt(document.getElementById('slider-bar').value);
  let selectedLocality = document.querySelector(".dropdown-item-checked").text;
  updateMap(selectedYear, selectedLocality);
})

// // changes the label of the current selected year for the user to see
// document.getElementById("slider-bar").addEventListener("input", function (e) {
//   let selectedYear = document.getElementById('slider-bar').value;


// });


async function updateMap(selectedYear, selectedLocality) {

  venues = await getVenues(selectedLocality);
  let observationData = await getObservations(selectedLocality);
  let filteredYearData = venues.features.filter(function (feature) {
    return feature.properties.year == selectedYear
  });
  //addVenueLayer(map, venues);

  addVenueLayer(map, toSecondaryGEOJSON(filteredYearData));
  let filteredYearObservationData = observationData.features.filter(function (feature) {
    return feature.properties.year == selectedYear
  });
  current_observation_data = filteredYearObservationData;
  current_venue_data = filteredYearData;
  // observation data
  // observations = await getObservations(selectedLocality);
  // addObservationLayer(map, toSecondaryGEOJSON(filteredYearObservationData));
  // let filteredYearObservations = observations.features.filter(function (feature) {
  //   return feature.properties.year == selectedYear
  // });
  removeAllLayers();

  // load all codes
  let code_data = await allCodes();
  createCodeCategories(code_data);

  let defaultCodes = codeIncludes(code_data, selectedYear)
  code_div(defaultCodes, venues, observationData, selectedYear);
  let active = false;
  // three js 3D object

  //switch event
  if (current_code_filter.length > 0) {
    if (venue_status && observation_status) {
      addCones(on_Screen_Data_Venue, active);
      addCubes(on_Screen_Data_Observe, active);
    } else if (venue_status) {
      addCones(on_Screen_Data_Venue, active);
    } else if (observation_status) {
      addCubes(on_Screen_Data_Observe, active);
    }
  } else {
    if (venue_status && observation_status) {
      addCones(filteredYearData, active);
      addCubes(filteredYearObservationData, active);
    } else if (venue_status) {
      addCones(filteredYearData, active);
    } else if (observation_status) {
      addCubes(filteredYearObservationData, active);
    }
  }
  //(map, toGEOJSON(filteredYearData));
  //addCubes(filteredYearObservationData, active);
  // create venue list and observation list
  makeLocalityList('locality-venues', venues, selectedYear);
  // makeLocalityList('locality-observations', observationData, selectedYear);
  // // sort locality features
  // Bo: Sort by name
  // localityFeatures.sort((a, b) => {
  //   let firstYear = parseFloat(a.properties.year);
  //   let secondYear = parseFloat(b.properties.year);
  //   let difference = firstYear - secondYear;
  //   // if ( difference  == 0 ) {
  //   //   difference = a.properties.observedvenuename.localeCompare(b.properties.observedvenuename);
  //   // }
  //   return difference;
  // })



  // function checkIssue() {
  //   let issues = document.querySelectorAll('.issuePanel');
  //   for (let issue of issues) {
  //     if(!issue.classList.contains('d-none')){
  //       issue.classList.add('d-none');
  //     }
  //   }
  // }

  // if (localityParent.firstChild == null) {
  //   let localityPar = document.createElement('div');
  //   localityPar.classList.add('m-3');
  //   localityPar.innerHTML = "No low confidence location nearby."
  //   localityParent.appendChild(localityPar);
  // };


  // If these two layers were not added to the map, abort
  if (!map.getLayer('observation') || !map.getLayer('data')) {
    return;
  }
  // Enumerate ids of the layers.
  let observationLyrBtn = document.getElementById('observation-layer');
  let venueLyrBtn = document.getElementById('venue-layer');
  const toggleableLayerIds = [observationLyrBtn, venueLyrBtn];

  toggleableLayerIds.forEach(element => {
    element.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      let clickedLayer = element.id;
      // get visibility status of current layer
      const visibility = map.getLayoutProperty(
        clickedLayer,
        'visibility'
      );
      // Toggle layer visibility by changing the layout object's visibility property.
      if (visibility === 'none') {
        map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
      } else {
        map.setLayoutProperty(
          clickedLayer,
          'visibility',
          'none'
        );
      }
    })
  })


}

// MAP ON LOAD
map.on('style.load', async function () {

  let selectedYear = parseInt(document.getElementById('slider-bar').value);
  let selectedLocality = document.querySelector(".dropdown-item-checked").text;
  updateMap(selectedYear, selectedLocality);
});

////////////////////////////////////////////////////
////////////////////////////////////////////////////
// when click on extrusion
map.on('click', 'year-block', function (e) {
  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(e.features[0].properties.name)
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
    }
    hoveredStateId = e.features[0].id;
    map.setFeatureState({
      source: 'year-block',
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
  }
  hoveredStateId = null;
});

// trigger review/location information on click of location point of map
map.on('click', 'data', async function (e) {
  // Bo: Perhaps highlight the nearby and label their names.
  if (map.getLayer('nearby-observations')) {
    map.removeLayer('nearby-observations');
    map.removeSource('nearby-observations');
  }
  // displayNearbyObservations(observations, e);
  // marker.remove();

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

  if (typeof map.getLayer('buffer-point') !== "undefined") {
    map.removeLayer('buffer-point');
    map.removeSource('buffer-point');
  };

  // clear review box is open
  let reviewBox = document.getElementById('type-review-box');
  reviewBox.classList.add('d-none');

  // add all left panel actions (including zoom and adding data points)
  let feature = e.features[0];
  viewLeftPanel(feature);
  addLeftPanelActions(feature, marker, e);
  // addExtrusions(feature, e);

  //add buffer
  let turfPoint = turf.point(feature.geometry.coordinates);
  let buffer = turf.buffer(turfPoint, 500, {
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
  if (e.features[0].properties.v_id !== undefined) {
    venueIndicator.innerHTML = "this is a confirmed venue";
  } else {
    venueIndicator.innerHTML = '';
  };

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

  // update frontend with new divs for each comment
  // publish comment on click
  // ** database only supports location with existing vids
  let vid = parseInt(document.getElementById('vid-review').innerHTML);
  let reviewParent = document.getElementById('reviews-container');

  while (reviewParent.firstChild) {
    reviewParent.removeChild(reviewParent.lastChild);
  };

  document.getElementById('publish-btn').removeEventListener('click', submitNewReview);
  document.getElementById('publish-btn').addEventListener('click', submitNewReview);
  // get all comments of the location
  let reviewData = await getReviews(vid);
  constructReviews(reviewData);
  // get all photos of the location by the google API
  // getStreetView(feature);
  getEvidenceInfo(feature);
});

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


// go back button
document.getElementById('go-back-btn').addEventListener('click', function () {

  // console.log("go back");

  if (!(document.getElementById('info-default').classList.contains('d-none'))) {

    toggleLeftPanelView('all')
    if (!document.getElementById('info').classList.contains('leftCollapse')) {
      document.getElementById('info').classList.toggle('leftCollapse');
    }

  }

  // document.getElementById('info').classList.toggle('leftCollapse');
  // toggleLeftPanelView('legend');
  if (typeof map.getLayer('selectedMarker') !== "undefined") {
    marker.remove();
    map.removeLayer('selectedMarker');
    map.removeSource('selectedMarker');
  };

  if (typeof map.getLayer('nearby-observations') !== "undefined") {
    marker.remove();
    map.removeLayer('nearby-observations');
    map.removeSource('nearby-observations');
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

// close button
document.getElementById('info-close-btn').addEventListener('click', function (e) {
  // trigger slideout/slide-in btn
  let collapsed = document.getElementById('info').classList.toggle('leftCollapse');
  document.getElementById('info-close-btn').classList.toggle('info-btn-collapse');
  let btnImg = document.getElementById('leftPanelArrow');
  if (collapsed) {
    btnImg.src = './assets/imgs/open-arrow.svg';
  } else {
    btnImg.src = './assets/imgs/back-btn.svg';
  }
  toggleLeftPanelView('legend');

  if (typeof map.getLayer('selectedMarker') !== "undefined") {
    marker.remove();
    map.removeLayer('selectedMarker');
    map.removeSource('selectedMarker');
  };

  if (typeof map.getLayer('nearby-observations') !== "undefined") {
    marker.remove();
    map.removeLayer('nearby-observations');
    map.removeSource('nearby-observations');
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

});

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


// Yufei: return function on report an issue panel
document.getElementById('return-btn').addEventListener('click', function () {
  marker.remove();
  if (!(document.getElementById('report-issue').classList.contains('d-none'))) {
    document.getElementById('report-issue').classList.add('d-none');
  }
  document.getElementById('info-default').classList.remove('d-none');
  document.getElementById('ground-truth-btns').classList.remove('d-none');
});

function makeAlert(alertText) {
  let alert = document.getElementById("alert-modal");
  let alertTextBox = document.getElementById("alert-text");
  alertTextBox.innerHTML = alertText;
  let alertModal = new bootstrap.Modal(alert);
  alertModal.show();
}

// // Yufei: handeling context lost
// var canvas = document.getElementById("map");
// canvas.addEventListener("webglcontextlost", function(event) {
//     event.preventDefault();
// }, false);

// canvas.addEventListener(
//   "webglcontextrestored", setupWebGLStateAndResources, false);

// // helper function setupWebGLStateAndResources
// function setupWebGLStateAndResources() {
//   var canvas = document.getElementById("map");
//   console.log("Context restored!");
//   // reset all the map elements here 
  
// }