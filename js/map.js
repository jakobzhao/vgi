mapboxgl.accessToken = config.accessToken;

var map = new mapboxgl.Map({
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

document.getElementsByClassName('mapboxgl-ctrl-top-right')[0].classList.add('navi-ctrls');
// geocoding search bar
let geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

// toggleLeftPanelView()
// Parameter:
// "references-container"       : Shows: DEFAULT LEFT DASHBOARD VIEW
//                   Hides: DATA PANEL, IMGS CONTAINER, VERIFICATION & REVIEW BTNS, ADD NEW OBSERVATION INFO PANEL
// "info-default"     : Shows: DATA PANEL, VERIFICATION & REVIEW BTNS, IMGS CONTAINER
//                 : Hides: DEFAULT PANEL, VERIFICATION PANEL, ADD NEW OBSERVATION INFO PANEL
// "validate-observation"        : Shows: VERFICATION PANEL
//                   Hides: DEFAULT PANEL, DATA PANEL, IMGS CONTAINER, ADD NEW OBSERVATION INFO PANEL
// "add-observation": Shows: ADD NEW OBSERVATION INFO PANEL
//                   Hides: DEFAULT PANEL, DATA PANEL, VERIFCATION & REVIEW BTNS, IMGS CONTAINER
// "validation-btns"
// "type-review-box"
// "reviews-confirmation"
// "reviews-container"
function toggleLeftPanelView(elementId) {
  $("#info > div").not($("#" + elementId)).addClass('d-none');
  $('#' + elementId).removeClass('d-none');

  // exceptions
  let footer = document.getElementById('footer-container');
  footer.classList.remove('d-none');

  if (elementId == "info-default") {
    document.getElementById('validation-btns').classList.remove('d-none');
    // if(!(document.getElementById('info-default').contains('d-none'))) {
    //   document.getElementById('validate-observation-btn').classList.toggle ('d-none');
    //   document.getElementById('add-review-btn').classList.toggle('d-none');
    //   document.getElementById('go-back-btn').classList.toggle('d-none');
    // }
  }
  if (elementId == "validate-observation") {
    document.getElementById('validation-btns').classList.remove('d-none');
    document.getElementById('validate-observation-btn').classList.toggle('d-none');
    document.getElementById('add-review-btn').classList.toggle('d-none');
    document.getElementById('go-back-btn').classList.toggle('d-none');
  }
};

// year_val()
// changes the label of the current selected year for the user to see
function year_val() {
  let selectedYear = document.getElementById('single-input').value;
  document.getElementById('label-year').innerHTML = selectedYear;
}

function venueList(data) {
  for (let i = 0; i < data.length; i++) {
    let venueParent = document.getElementById('confirmed-venues');
    let venueDiv = document.createElement('div');
    venueDiv.classList.add('m-3');
    venueDiv.innerHTML = data[i].name;
    venueParent.appendChild(venueDiv);
  };
};

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
};

// getReviews
// Obtain data from database containing information for all the reviews of a specific location
async function getReviews(vid) {
  try {
    let id = vid;
    let getReview = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/comment/${id}`, {
      method: 'GET'
    });
    let reviewData = await getReview.json();
    console.log(reviewData);
    constructReviews(reviewData);
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
    let sendData = await fetch('https://lgbtqspaces-api.herokuapp.com/api/add-comment', settings);
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

// displayData
// Obtain the data from the database given the input values from the year slider
// returns a complete GEOJSON data output that is filtered with the matching dates
async function displayData() {
  try {
    let cityList = ['Seattle', 'Atlanta', 'Cleveland', 'Nashville']
    let venueData = [];
    for (let i = 0; i < cityList.length; i++) {
      let city = cityList[i];
      let getVenueData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/venues/${city}`, {
        method: 'GET'
      });
      getVenueData = await getVenueData.json();
      venueData = venueData.concat(getVenueData);
    }
    return toGEOJSON(venueData);
  } catch (error) {
    console.log(error);
  }
};

// getVenueSlice
// Obtain data from database that contains all the venue slices in database
async function getVenueSlice() {
  try {
    let city = 'Seattle';
    let getVenueSlice = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/venueSlice/${city}`, {
      method: 'GET'
    });
    let venueSliceData = await getVenueSlice.json();
    return toGEOJSON(venueSliceData);
  } catch (err) {
    console.log(err);
  }
};

// getObservations
async function getObservations() {
  try {
    let city = "Seattle";
    let getObservationData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/observations/${city}`, {
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
  for (let i = 0; i < data.length; i++) {
    let temp = {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [data[i].longitude, data[i].latitude]
      },
      "properties": getProperties(data[i])
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
function addDataLayer(obsData) {
  map.loadImage('./assets/imgs/marker.png', function (error, image) {
    if (error) throw error;
    map.addImage('init-marker', image, {
      sdf: true
    });
  });
  map.loadImage('./assets/imgs/red-marker.png', function (error, image) {
    if (error) throw error;
    map.addImage('red-marker', image, {
      sdf: true
    });
  });

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

// add accordion layer - for verified and unverified venues
function addAccordionLayer(data, type) {
  // let comparisons = verifiedData.feature.length;
  // if(data.features.length < verifiedData.features.length) {
  //   comparisons = data.feature.length;
  // };
  let dataCleaned = data.features;
  let test = {
    'type': 'FeatureCollection',
    'features': dataCleaned.map((location, index) => ({
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
    'id': (type == 'observation') ? 'unverified-venues' : 'verified-venues',
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

  // map.addLayer({
  //   'id': (type == 'observation') ? 'unverified-venues' : 'verified-venues',
  //   'type': 'circle',
  //   'source': {
  //     type: 'geojson',
  //     data: data
  //   },
  //   'layout': {
  //     'visibility': 'none'
  //   },
  //   'paint': {
  //     'circle-radius': 3,
  //     'circle-stroke-width': 2,
  //     'circle-color': (type == 'observation') ? 'red' : 'green',
  //     'circle-stroke-color': 'white'
  //   }
  // });
};

// basemap switching/styling
var layerList = document.getElementsByClassName('layers-input-container');

function switchLayer(layer) {
  var layerId = layer.target.id;
  map.setStyle('mapbox://styles/mapbox/' + layerId);

  // adjust slider text color when changing basemaps
  // document.getElementById('slider-time').setAttribute("style", "color: black;");
};

// assign switch layer function for all radio button inputs
for (var i = 0; i < layerList.length; i++) {
  layerList[i].onclick = switchLayer;
};

// function slide-in left panel
function viewLeftPanel(e) {
  // parse the codes to increase readability
  let codeString = "";
  let codes = e.properties.codedescriptorlist;
  for (let i = 0; i < codes.length; i++) {
    if (codes[i] !== '[' && codes[i] !== '"' && codes[i] !== '.' && codes[i] !== ']' && codes[i] !== "'") {
      codeString += codes[i];
    }
  };

  // left panel location information
  document.getElementById('name').innerHTML = infoNullCheck(e.properties.observedvenuename);
  document.getElementById('address').innerHTML = infoNullCheck(e.properties.address);
  document.getElementById('formal-address').innerHTML = infoNullCheck(e.properties.formaladdress);
  document.getElementById('year-info').innerHTML = infoNullCheck(e.properties.year);
  document.getElementById('city').innerHTML = infoNullCheck(e.properties.city);
  document.getElementById('state').innerHTML = infoNullCheck(e.properties.state);
  document.getElementById('code').innerHTML = infoNullCheck(codeString);
  document.getElementById('type').innerHTML = infoNullCheck(e.properties.category);

  //vid for comment
  document.getElementById('vid-review').innerHTML = e.properties.vid;

  // Edit observation pre-filled values
  document.getElementById('observed-name-edit').value = e.properties.observedvenuename;
  document.getElementById('address-edit').value = e.properties.address;
  document.getElementById('city-edit').value = e.properties.city;
  document.getElementById('state-edit').value = e.properties.state;
  document.getElementById('year-edit').value = e.properties.year;
  document.getElementById('zip-edit').value = e.properties.zip;
  document.getElementById('long-edit').value = e.geometry.coordinates[0];
  document.getElementById('lat-edit').value = e.geometry.coordinates[1];
  document.getElementById('type-edit').value = e.properties.category;
  document.getElementById('notes-edit').value = e.properties.notes;
  document.getElementById('codelist-edit').value = codeString;
  document.getElementById('confidence-edit').value = e.properties.confidence;

};

function infoNullCheck(string) {
  return ((string != "null") ? string : 'data unavailable');
};
// left panel functionalities (validate observation marker view, selected marker view, map zoom to selected point)
async function addLeftPanelActions(feature, marker, e) {
  let coordinates = feature.geometry.coordinates.slice();
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  };
  map.flyTo({
    center: feature.geometry.coordinates,
    zoom: 16.5,
    speed: 0.3,
    pitch: 75,
    bearing: -25,
    essential: true
  });

  if (typeof map.getLayer('selectedMarker') !== "undefined") {
    map.removeLayer('selectedMarker');
    map.removeSource('selectedMarker');
  };

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

  // if validate observation is clicked, display movable marker
  let validateObservation = document.getElementById('validate-observation-btn');

  validateObservation.addEventListener('click', function () {
    // ensure that user is logged-in
    let check = logInCheck();
    if (check) {
      marker.setLngLat(coordinates).addTo(map);

      function onDragEnd() {
        var lngLat = marker.getLngLat();
        document.getElementById('long-edit').value = lngLat.lng;
        document.getElementById('lat-edit').value = lngLat.lat;
      }
      marker.on('dragend', onDragEnd);
    }
  });
};

// if a specific locality is selected, recenter the map to that locality
let localitySelectS = document.getElementById('Seattle');
localitySelectS.addEventListener('click', function () {
  map.flyTo({
    center: [-122.3321, 47.6062],
    zoom: 14,
    speed: 0.9,
    pitch: 75,
    bearing: -25,
    essential: true
  });
})
let localitySelectA = document.getElementById('Atlanta');
localitySelectA.addEventListener('click', function () {
  map.flyTo({
    center: [-84.3880, 33.7490],
    zoom: 14,
    speed: 0.9,
    pitch: 75,
    bearing: -25,
    essential: true
  });
})
let localitySelectN = document.getElementById('Nashville');
localitySelectN.addEventListener('click', function () {
  map.flyTo({
    center: [-86.7816, 36.1627],
    zoom: 14,
    speed: 0.9,
    pitch: 75,
    bearing: -25,
    essential: true
  });
})
let localitySelectC = document.getElementById('Cleveland');
localitySelectC.addEventListener('click', function () {
  map.flyTo({
    center: [-81.6944, 41.4993],
    zoom: 14,
    speed: 0.9,
    pitch: 75,
    bearing: -25,
    essential: true
  });
})

function logInCheck() {
  let signInView = document.getElementById('signInBtn');
  // if left panel is closed
  if (document.getElementById('info').classList.contains('leftCollapse')) {
    let collapseState = document.getElementById('info').classList.toggle('leftCollapse');
    document.getElementById('info-close-btn').classList.toggle('info-btn-collapse');
    let btnImg = document.getElementById('leftPanelArrow');
    if (collapseState) {
      btnImg.src = './assets/imgs/open-arrow.svg';
    } else {
      btnImg.src = './assets/imgs/back-btn.svg';
    }
  }

  if (signInView.classList.contains('d-none')) {
    // if contains display none, means that user is logged in
    toggleLeftPanelView('validate-observation');
    return true;
  } else {
    alert('Please sign in through Google first!');
  }
  return false;
}

// create and style all incoming reviews from API request
function constructReviews(reviewData) {
  let reviewParent = document.getElementById('reviews-container');

  for (let i = 0; i < reviewData.length; i++) {
    let reviewDiv = document.createElement('div');
    reviewDiv.innerHTML = reviewData[i].content;
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

  var scaleTest = chroma.scale('OrRd').colors(12);
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

// // add div for the codes corresponding to selected year on the map
// function code_div(data, locationData, year) {
//   let code_parent = document.getElementById('dropdown');
//   // clear everything in div first (in case already populated with existing data)
//   while (code_parent.firstChild) {
//     code_parent.removeChild(code_parent.lastChild);
//   };

//   let standard = document.createElement('div');
//   standard.innerHTML = "CLEAR";
//   standard.title = "Clear all selected filters";
//   standard.addEventListener('click', function() {
//     map.setFilter('data', undefined);
//     // map filter of single year selected by the user
//     map.setFilter('data', ["==", ['number', ['get', 'year']], year]);
//     let selectionDiv = document.getElementById('dropdown-container');
//     selectionDiv.classList.toggle('d-none');
//     // remove 3D layer
//     if (map.getLayer('custom-layer')) {
//       map.removeLayer('custom-layer');
//     };
//     let onScreenData = locationData.features.filter(function(feature) {
//       return feature.properties.year == year
//     });
//     console.log(onScreenData);
//     addCones(onScreenData, false);
//   });

//   standard.classList.add('dropdown-div');
//   code_parent.appendChild(standard);

//   // Meta Descriptor: Caution/Restriction
//   let restrictionDescriptor = document.createElement('div');
//   restrictionDescriptor.innerHTML = "This panel shows a list of Codes being used during that specific year's version of Damron Guides. Click on a code to screen out the qualified venues. Click \"Clear\" to cancel any applied filter.";
//   restrictionDescriptor.title = "Meta Descriptor: Caution/Restriction";
//   restrictionDescriptor.classList.add('metaDescriptor');
//   code_parent.appendChild(restrictionDescriptor);

//   // for each object in data
//   for (let code in data) {
//     let singleCode = data[code];
//     // check metaDescriptors
//     if (singleCode.name == "Caution/Restriction") {
//       let codeDiv = document.createElement('div');
//       codeDiv.innerHTML = singleCode.code;
//       codeDiv.title = singleCode.name;

//       // for each code_div add event listener on click to add filter features of the map
//       codeDiv.addEventListener('click', function() {
//         map.setFilter('data', ['in', singleCode.code, ['get', 'codedescriptorlist']]);
//         let selectionDiv = document.getElementById('dropdown-container');
//         selectionDiv.classList.toggle('d-none');

//         // remove 3D layer
//         if (map.getLayer('custom-layer')) {
//           map.removeLayer('custom-layer');
//         };

//         let result = [];
//         locationData.features.filter(function(feature) {
//           if (Array.isArray(feature.properties.codedescriptorlist) && feature.properties.codedescriptorlist.includes(singleCode.code)) {
//             result.push(feature);
//           }
//         });
//         addCones(result, false);
//       })

//       // add corresponding style here
//       codeDiv.classList.add('dropdown-div');
//       code_parent.appendChild(codeDiv);
//     }
//   };
// }

// add div for the codes corresponding to selected year on the map
function code_div(data, locationData, year) {
  let code_parent = document.getElementById('dropdown');
  let code_parent1 = document.getElementById('dropdown1')
  let code_parent2 = document.getElementById('dropdown2')
  let code_parent3 = document.getElementById('dropdown3')
  let code_parent4 = document.getElementById('dropdown4')
  let code_parent5 = document.getElementById('dropdown5')
  let Descriptorlist_parent = document.getElementById('codeDescriptorList')
  // clear everything in div first (in case already populated with existing data)
  while (code_parent.firstChild) {
    code_parent.removeChild(code_parent.lastChild);
  };

  while (code_parent1.firstChild) {
    code_parent1.removeChild(code_parent1.lastChild);
  };

  while (code_parent2.firstChild) {
    code_parent2.removeChild(code_parent2.lastChild);
  };

  while (code_parent3.firstChild) {
    code_parent3.removeChild(code_parent3.lastChild);
  };

  while (code_parent4.firstChild) {
    code_parent4.removeChild(code_parent4.lastChild);
  };

  while (code_parent5.firstChild) {
    code_parent5.removeChild(code_parent5.lastChild);
  };

  let standard = document.createElement('div');
  standard.innerHTML = "CLEAR";
  standard.title = "Clear all selected filters";
  standard.addEventListener('click', function () {
    map.setFilter('data', undefined);
    // map filter of single year selected by the user
    map.setFilter('data', ["==", ['number', ['get', 'year']], year]);
    // let selectionDiv = document.getElementById('dropdown-container');
    // selectionDiv.classList.toggle('d-none');
    // remove 3D layer
    if (map.getLayer('custom-layer')) {
      map.removeLayer('custom-layer');
    };
    let onScreenData = locationData.features.filter(function (feature) {
      return feature.properties.year == year
    });
    console.log(onScreenData);
    addCones(onScreenData, false);
  });

  standard.classList.add('dropdown-div-clear');
  Descriptorlist_parent.appendChild(standard);

  // Meta Descriptor: Entry Descriptors
  let entryDescriptor = document.createElement('div');
  entryDescriptor.innerHTML = "Here are all the entry descriptors";
  entryDescriptor.title = "Meta Descriptor: Entry Descriptors";
  entryDescriptor.classList.add('metaDescriptor');
  code_parent.appendChild(entryDescriptor);

  // for each object in data
  for (let code in data) {
    let singleCode = data[code];
    // check metaDescriptors
    if (singleCode.name == "Entry Descriptors") {
      let codeDiv = document.createElement('div');
      codeDiv.innerHTML = singleCode.code;
      codeDiv.title = singleCode.name;

      // for each code_div add event listener on click to add filter features of the map
      codeDiv.addEventListener('click', function () {
        map.setFilter('data', ['in', singleCode.code, ['get', 'codedescriptorlist']]);
        let selectionDiv = document.getElementById('dropdown-container');
        // selectionDiv.classList.toggle('d-none');

        // remove 3D layer
        if (map.getLayer('custom-layer')) {
          map.removeLayer('custom-layer');
        };

        let result = [];
        locationData.features.filter(function (feature) {
          if (Array.isArray(feature.properties.codedescriptorlist) && feature.properties.codedescriptorlist.includes(singleCode.code)) {
            result.push(feature);
          }
        });
        addCones(result, false);
      })

      // add corresponding style here
      codeDiv.classList.add('dropdown-div');
      code_parent.appendChild(codeDiv);
    }
  };

  // Meta Descriptor: User Descriptors
  let userDescriptor = document.createElement('div');
  userDescriptor.innerHTML = "Here are all the clientele or user descriptors";
  userDescriptor.title = "Meta Descriptor: Clientele/User Descriptors";
  userDescriptor.classList.add('metaDescriptor');
  code_parent1.appendChild(userDescriptor);

  // for each object in data
  for (let code in data) {
    let singleCode = data[code];
    // check metaDescriptors
    if (singleCode.name == "Clientele/User Descriptors") {
      let codeDiv = document.createElement('div');
      codeDiv.innerHTML = singleCode.code;
      codeDiv.title = singleCode.name;

      // for each code_div add event listener on click to add filter features of the map
      codeDiv.addEventListener('click', function () {
        map.setFilter('data', ['in', singleCode.code, ['get', 'codedescriptorlist']]);
        let selectionDiv = document.getElementById('dropdown-container');
        // selectionDiv.classList.toggle('d-none');

        // remove 3D layer
        if (map.getLayer('custom-layer')) {
          map.removeLayer('custom-layer');
        };

        let result = [];
        locationData.features.filter(function (feature) {
          if (Array.isArray(feature.properties.codedescriptorlist) && feature.properties.codedescriptorlist.includes(singleCode.code)) {
            result.push(feature);
          }
        });
        addCones(result, false);
      })

      // add corresponding style here
      codeDiv.classList.add('dropdown-div');
      code_parent1.appendChild(codeDiv);
    }
  };

  // Meta Descriptor: Amenity/Service
  let amenityDescriptor = document.createElement('div');
  amenityDescriptor.innerHTML = "Amenities/Services";
  amenityDescriptor.title = "Here are all the amenity or service descriptors";
  amenityDescriptor.classList.add('metaDescriptor');
  code_parent2.appendChild(amenityDescriptor);

  // for each object in data
  for (let code in data) {
    let singleCode = data[code];
    // check metaDescriptors
    if (singleCode.name == "Amenities/Services") {
      let codeDiv = document.createElement('div');
      codeDiv.innerHTML = singleCode.code;
      codeDiv.title = singleCode.name;

      // for each code_div add event listener on click to add filter features of the map
      codeDiv.addEventListener('click', function () {
        map.setFilter('data', ['in', singleCode.code, ['get', 'codedescriptorlist']]);
        let selectionDiv = document.getElementById('dropdown-container');
        // selectionDiv.classList.toggle('d-none');

        // remove 3D layer
        if (map.getLayer('custom-layer')) {
          map.removeLayer('custom-layer');
        };

        let result = [];
        locationData.features.filter(function (feature) {
          if (Array.isArray(feature.properties.codedescriptorlist) && feature.properties.codedescriptorlist.includes(singleCode.code)) {
            result.push(feature);
          }
        });
        addCones(result, false);
      })

      // add corresponding style here
      codeDiv.classList.add('dropdown-div');
      code_parent2.appendChild(codeDiv);
    }
  };

  // Meta Descriptor: Caution/Restriction
  let restrictionDescriptor = document.createElement('div');
  restrictionDescriptor.innerHTML = "Caution/Restriction";
  restrictionDescriptor.title = "Meta Descriptor: Caution/Restriction";
  restrictionDescriptor.classList.add('metaDescriptor');
  code_parent3.appendChild(restrictionDescriptor);

  // for each object in data
  for (let code in data) {
    let singleCode = data[code];
    // check metaDescriptors
    if (singleCode.name == "Caution/Restriction") {
      let codeDiv = document.createElement('div');
      codeDiv.innerHTML = singleCode.code;
      codeDiv.title = singleCode.name;

      // for each code_div add event listener on click to add filter features of the map
      codeDiv.addEventListener('click', function () {
        map.setFilter('data', ['in', singleCode.code, ['get', 'codedescriptorlist']]);
        let selectionDiv = document.getElementById('dropdown-container');
        // selectionDiv.classList.toggle('d-none');

        // remove 3D layer
        if (map.getLayer('custom-layer')) {
          map.removeLayer('custom-layer');
        };

        let result = [];
        locationData.features.filter(function (feature) {
          if (Array.isArray(feature.properties.codedescriptorlist) && feature.properties.codedescriptorlist.includes(singleCode.code)) {
            result.push(feature);
          }
        });
        addCones(result, false);
      })

      // add corresponding style here
      codeDiv.classList.add('dropdown-div');
      code_parent3.appendChild(codeDiv);
    }
  };

  // Meta Descriptor: Organization/Association
  let organizationDescriptor = document.createElement('div');
  organizationDescriptor.innerHTML = "organization/association";
  organizationDescriptor.title = "Meta Descriptor: organization/association";
  organizationDescriptor.classList.add('metaDescriptor');
  code_parent4.appendChild(organizationDescriptor);

  // for each object in data
  for (let code in data) {
    let singleCode = data[code];
    // check metaDescriptors
    if (singleCode.name == "Organization/Association") {
      let codeDiv = document.createElement('div');
      codeDiv.innerHTML = singleCode.code;
      codeDiv.title = singleCode.name;

      // for each code_div add event listener on click to add filter features of the map
      codeDiv.addEventListener('click', function () {
        map.setFilter('data', ['in', singleCode.code, ['get', 'codedescriptorlist']]);
        let selectionDiv = document.getElementById('dropdown-container');
        // selectionDiv.classList.toggle('d-none');

        // remove 3D layer
        if (map.getLayer('custom-layer')) {
          map.removeLayer('custom-layer');
        };

        let result = [];
        locationData.features.filter(function (feature) {
          if (Array.isArray(feature.properties.codedescriptorlist) && feature.properties.codedescriptorlist.includes(singleCode.code)) {
            result.push(feature);
          }
        });
        addCones(result, false);
      })

      // add corresponding style here
      codeDiv.classList.add('dropdown-div');
      code_parent4.appendChild(codeDiv);
    }
  };

  // Meta Descriptor: Other
  let otherDescriptor = document.createElement('div');
  otherDescriptor.innerHTML = "Other Descriptors";
  otherDescriptor.title = "Meta Descriptor: other";
  otherDescriptor.classList.add('metaDescriptor');
  code_parent5.appendChild(otherDescriptor);

  // for each object in data
  for (let code in data) {
    let singleCode = data[code];
    // check metaDescriptors
    if (singleCode.name == "Other") {
      let codeDiv = document.createElement('div');
      codeDiv.innerHTML = singleCode.code;
      codeDiv.title = singleCode.name;

      // for each code_div add event listener on click to add filter features of the map
      codeDiv.addEventListener('click', function () {
        map.setFilter('data', ['in', singleCode.code, ['get', 'codedescriptorlist']]);
        let selectionDiv = document.getElementById('dropdown-container');
        // selectionDiv.classList.toggle('d-none');

        // remove 3D layer
        if (map.getLayer('custom-layer')) {
          map.removeLayer('custom-layer');
        };

        let result = [];
        locationData.features.filter(function (feature) {
          if (Array.isArray(feature.properties.codedescriptorlist) && feature.properties.codedescriptorlist.includes(singleCode.code)) {
            result.push(feature);
          }
        });
        addCones(result, false);
      })

      // add corresponding style here
      codeDiv.classList.add('dropdown-div');
      code_parent5.appendChild(codeDiv);
    }
  };
}

// obtain damron codes of corresponding year
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
function getStreetView(feature) {
  let imgParent = document.getElementById('imgs-container');
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
  console.log(fetchURL);

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
// Requets uses a location bias and location names to search (similar to a google search)
// Parameters:
//  feature: javascript object that contains complete data of a clicked location
function getPhotos(feature) {
  let imgParent = document.getElementById('imgs-container');
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
      console.log(status);
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

function addNames(data) {
  let result = {}
  result.type = "FeatureCollection";
  result.features = [];
  for(var id in data) {
    result.features.push(data[id])
  }
  console.log(result)
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
      'text-variable-anchor': ['left'],
      'text-radial-offset': 0.5,
      'text-justify': 'auto',
      'text-writing-mode': ['vertical'],
    }
  });
}

function addCones(data, active) {
  addNames(data);
  map.addLayer({
    id: 'custom-layer',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (map, mbxContext) {
      mbxContext = map.getCanvas().getContext('webgl');
      window.tb = new Threebox(
        map,
        mbxContext, {
          defaultLights: true
        }
      );

      // initialize geometry and material of our cube object
      let geometry = new THREE.ConeGeometry(20, 40, 64);
      let geometrySup = new THREE.CylinderGeometry(1, 1, 80, 32);

      let material = new THREE.MeshPhysicalMaterial({
        flatShading: true,
        color: '#D3B1C2',
        // transparent: true,
        // opacity: 0.5
      });

      let materialSup = new THREE.MeshBasicMaterial({
        flatShading: true,
        color: '#8bd5ee',
        transparent: true,
        opacity: 0.5
      });

      let materialOnClick = new THREE.MeshPhysicalMaterial({
        flatShading: true,
        color: '#ff6262',
        // transparent: true,
        // opacity: 0.5
      });

      let materialOnHover = new THREE.MeshPhysicalMaterial({
        flatShading: true,
        color: '#69c3bb',
        transparent: true,
        opacity: 0.9
      });

      let coneTemplate = new THREE.Mesh(geometry, material);
      coneTemplate = tb.Object3D({
        obj: coneTemplate,
        units: 'meters'
      }).set({
        rotation: {
          x: -90,
          y: 0,
          z: 0
        }
      });

      let lineTemplate = new THREE.Mesh(geometrySup, material);
      lineTemplate = tb.Object3D({
        obj: lineTemplate,
        units: 'meters'
      }).set({
        rotation: {
          x: -90,
          y: 0,
          z: 0
        }
      });

      data.forEach(function (feature) {
        // longitude, latitude, altitude
        let cone = coneTemplate.duplicate().setCoords([feature.geometry.coordinates[0], feature.geometry.coordinates[1], 20]);
        let line = lineTemplate.duplicate().setCoords([feature.geometry.coordinates[0], feature.geometry.coordinates[1], 0]);
        tb.add(cone);
        tb.add(line);
      })

      var highlighted = [];

      //add mousing interactions
      map.on('click', function (e) {
        // Clear old objects
        highlighted.forEach(function (h) {
          h.material = material;
        });
        highlighted.length = 0;

        // calculate objects intersecting the picking ray
        var intersect = tb.queryRenderedFeatures(e.point)[0]
        var intersectionExists = typeof intersect == "object"

        // if intersect exists, highlight it
        if (intersect) {
          var nearestObject = intersect.object;
          nearestObject.material = materialOnClick;
          highlighted.push(nearestObject);
        } else {
          console.log("change back");
        }

        // on state change, fire a repaint
        if (active !== intersectionExists) {
          active = intersectionExists;
          tb.repaint();
        }
      });


      var hovered = null;

      //add mousing hover interactions
      // map.on('mousemove', function(e) {
      //   if (hovered != null) {
      //     hovered.material = material;
      //     if (hovered == highlighted[0]) {
      //       hovered.material = materialOnClick;
      //     }

      //     // hovered.material = material;
      //     hovered = null;
      //   }

      //   // calculate objects intersecting the picking ray
      //   var intersect = tb.queryRenderedFeatures(e.point)[0]
      //   var intersectionExists = typeof intersect == "object"

      //   // if intersect exists, highlight it
      //   if (intersect) {
      //     var nearestObject = intersect.object;
      //     nearestObject.material = materialOnHover;
      //     hovered = nearestObject;
      //   } else {
      //     console.log("change back");
      //   }

      //   // on state change, fire a repaint
      //   if (active !== intersectionExists) {
      //     active = intersectionExists;
      //     tb.repaint();
      //   }
      // });
    },

    render: function (gl, matrix) {
      tb.update();
    }
  });
};

function displayNearbyObservations(obsData, e) {
  let observationData = obsData.features;
  let selectedData = e.features[0];

  let coordinates = selectedData.geometry.coordinates.slice();
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  };

  const polygonRadius = 0.5;
  let options = {
    steps: 100,
    units: 'kilometers'
  };

  const circleRadius = 0.02;
  let circleOptions = {
    steps: 100,
    units: 'kilometers'
  };

  let points = [];
  observationData.forEach((element, index) => {
    points.push(element.geometry.coordinates);
  });

  let turfPoints = turf.points(points);
  let searchWithin = turf.circle(coordinates, polygonRadius, options);
  let result = turf.pointsWithinPolygon(turfPoints, searchWithin);
  // for each point that is within the circle boundary
  result.features.forEach((element, index) => {
    element.geometry = turf.circle(element.geometry.coordinates, circleRadius, circleOptions).geometry;
    element.properties = {
      'height': 75,
      // 'height': (((index == 0) ? 50 : (index + 1) * 150 - 45) + 145),
      // 'base': ((index == 0) ? 50 : (index + 1) * 150 - 10),
      'base': 50,
      'paint': 'green'
    }
  });

  map.addLayer({
    id: 'nearby-observations',
    type: 'fill-extrusion',
    source: {
      type: 'geojson',
      data: {
        "type": "FeatureCollection",
        "features": []
      },
      tolerance: 0
    },
    paint: {
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
  map.getSource('nearby-observations').setData(result);
};


////////////////////////////////////////////////////////////////////////////////////
// MAP ON LOAD
map.on('style.load', async function () {

  // load data
  // on slider change
  let defaultYear = parseInt(document.getElementById('single-input').value);

  let verifiedData = await displayData();
  addDataLayer(verifiedData);
  map.setFilter('data', ["==", ['number', ['get', 'year']], defaultYear]);

  // observation data
  let unverifiedVenues = await getObservations();
  let verifiedVenues = await getVenueSlice();
  console.log(verifiedVenues)


  addAccordionLayer(unverifiedVenues, 'observation');
  addAccordionLayer(verifiedVenues, 'venue-slice');

  // load all code data from database
  let code_data = await allCodes();
  let defaultCodes = codeIncludes(code_data, defaultYear)
  code_div(defaultCodes, verifiedData, defaultYear);

  let active = false;
  // three js 3D object
  let onScreenData = map.getSource('data')._data.features;
  addCones(onScreenData, active);
  // filter data based upon input
  // let years = document.querySelectorAll('.year-slider');
  let years = document.getElementById('single-input');

  years.addEventListener('input', async function (e) {
    let selectYear = parseInt(years.value);

    // filter map view to selected year
    // map.setFilter('data', ["==", ['number', ['get', 'year']], selectYear]);

    let filteredYearData = verifiedVenues.features.filter(function (feature) {
      return feature.properties.year == selectYear
    });

    // add 3-d shapes and remove previous existing shapes
    if (map.getLayer('custom-layer')) {
      map.removeLayer('custom-layer');
    };
    if (map.getLayer('poi-labels')) {
      map.removeLayer('poi-labels');
      map.removeSource('venues');
    };
    // add new custom layer
    addCones(filteredYearData, false);
    let result = codeIncludes(code_data, selectYear);
    // construct div for each damron code available
    code_div(result, verifiedData, selectYear);
  });

  // create temporary marker if user wants to validate a location
  var marker = new mapboxgl.Marker({
    draggable: true
  });

  // venue- left dashboard add venues from database
  // split obs data to matching years
  let selectYear = document.getElementById('single-input').value;
  // let yearRight = document.getElementById('input-right').value;
  let localityParent = document.getElementById('locality-venues');

  let localityFeatures = verifiedData.features;
  // sort locality features
  localityFeatures.sort((a, b) => {
    let firstYear = parseFloat(a.properties.year);
    let secondYear = parseFloat(b.properties.year);
    let difference = firstYear - secondYear;
    // if ( difference  == 0 ) {
    //   difference = a.properties.observedvenuename.localeCompare(b.properties.observedvenuename);
    // }
    return difference;
  })

  for (let i = 0; i < localityFeatures.length; i++) {
    if (localityFeatures[i].properties.year == selectYear) {
      if (localityFeatures[i].properties.confidence < 0.85) {
        // bootstrap row
        let rowDiv = document.createElement('div');
        rowDiv.classList.add('row', "m-1");
        let venueName = document.createElement('div');
        let venueConfidence = document.createElement('div');
        venueName.classList.add('col');
        venueConfidence.classList.add("col", "col-sm-3");

        let confidence = parseFloat(localityFeatures[i].properties.confidence);

        venueName.innerHTML = localityFeatures[i].properties.observedvenuename;
        venueConfidence.innerHTML = confidence.toFixed(2);

        rowDiv.appendChild(venueName);
        rowDiv.appendChild(venueConfidence);

        localityParent.appendChild(rowDiv);
        rowDiv.addEventListener('click', function () {
          viewLeftPanel(localityFeatures[i]);
          addLeftPanelActions(localityFeatures[i], marker);
          // addExtrusions(localityFeatures[i]);
        });
      }
    }
  }

  if (localityParent.firstChild == null) {
    let localityPar = document.createElement('div');
    localityPar.classList.add('m-3');
    localityPar.innerHTML = "No low confidence location nearby."
    localityParent.appendChild(localityPar);
  };

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
    // get points that are within the boundary for observations
    // get points that are within the boundary for unverified venues
    if(map.getLayer('nearby-observations')) {
      map.removeLayer('nearby-observations');
      map.removeSource('nearby-observations');
    }
    displayNearbyObservations(unverifiedVenues, e);

    // marker.remove();
    if (document.getElementById('info').classList.contains('leftCollapse')) {
      let collapseState = document.getElementById('info').classList.toggle('leftCollapse');
      document.getElementById('info-close-btn').classList.toggle('info-btn-collapse');
      let btnImg = document.getElementById('leftPanelArrow');
      if (collapseState) {
        btnImg.src = './assets/imgs/open-arrow.svg';
      } else {
        btnImg.src = './assets/imgs/back-btn.svg';
      }
    }

    // load clicked marker info on left panel 
    toggleLeftPanelView('info-default');

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
    // map.removeLayer('year-block');
    // map.removeSource('year-block');

    // add all left panel actions (including zoom and adding data points)
    let feature = e.features[0];
    viewLeftPanel(feature);
    addLeftPanelActions(feature, marker, e);
    addExtrusions(feature, e);
    // buffer
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
    await getReviews(vid);
    // get all photos of the location by the google API
    getStreetView(feature);
  });

  // helper function to submit new review
  function submitNewReview(e) {
    let vid = parseInt(document.getElementById('vid-review').innerHTML);
    let submitCheck = document.getElementById('user-review-input').value;
    // check if
    if (/^\s*$/g.test(submitCheck)) {
      alert('Invalid comment. No text detected!');
    } else {
      // add new review
      addNewReview(e, vid);
    }
  };

  async function submitPassword(e) {
    try {
      let passwordAttempt = document.getElementById('passwordInput').value;
      console.log(passwordAttempt)
      let getResult = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/passphraseCheck/${passwordAttempt}`, {
        method: 'GET'
      });
      let result = await getResult.json();
      if (result[0]['Result'] == '0') {
        // alert('Login success!');
        document.getElementById('signin-modal').innerHTML = '<br>&nbsp;&nbsp;&nbsp;&nbsp;Log in successfully, thank you!<br><br>';
        document.getElementById('signInBtn').classList.toggle('d-none');
      } else if (result[0]['Result'] == '1') {
        alert('Incorrect password, please try again.')
      } else {
        console.log('error')
      }
    } catch (err) {
      console.log(err);
    }
  }

  document.getElementById('signin-btn').addEventListener('click', submitPassword);

  // go back button
  document.getElementById('go-back-btn').addEventListener('click', function () {
    if (!(document.getElementById('validate-observation').classList.contains('d-none'))) {
      document.getElementById('validate-observation').classList.toggle('d-none');
      document.getElementById('validate-observation-btn').classList.toggle('d-none');
      document.getElementById('add-review-btn').classList.toggle('d-none');
      document.getElementById('go-back-btn').classList.toggle('d-none');
    }
    toggleLeftPanelView('references-container');
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

  // validation button
  // toggleview
  // document.getElementById('validate-observation-btn').addEventListener('click', function() {
  //   toggleLeftPanelView('validate-observation');
  // })

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
    toggleLeftPanelView('references-container');
    // let padding = {};

    // padding['left'] = collapsed ? 0 : 100;
    // map.easeTo({
    //   zoom: padding['left'] = collapsed ? 13  : 12,
    //   duration: 1000
    // })
    // clear marker

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

  // If these two layers were not added to the map, abort
  if (!map.getLayer('unverified-venues') || !map.getLayer('verified-venues')) {
    return;
  }
  // Enumerate ids of the layers.
  let unverifiedVenuesBtn = document.getElementById('unverified-venues');
  let verifiedVenuesBtn = document.getElementById('verified-venues');
  const toggleableLayerIds = [unverifiedVenuesBtn, verifiedVenuesBtn];

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

});