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


//click on the map to hide the locality and/or the code filter menus.
map.on('click', (e) => {
  let localityList = document.getElementById('localityList');
  localityList.classList.add('d-none');

  let codeDescriptorList = document.getElementById('codeDescriptorList');
  codeDescriptorList.classList.add('d-none');
});

document.getElementsByClassName('mapboxgl-ctrl-top-right')[0].classList.add('navi-ctrls');
// geocoding search bar
let geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  placeholder: "Search a local place...",
  enableGeoLocation: true
}).onAdd(map);

document.getElementById('geocoder').appendChild(geocoder);



// toggleLeftPanelView()
// Parameter:
// "legend"       : Shows: DEFAULT LEFT DASHBOARD VIEW
//                   Hides: DATA PANEL, IMGS CONTAINER, VERIFICATION & REVIEW BTNS, ADD NEW OBSERVATION INFO PANEL
// "info-default"     : Shows: DATA PANEL, VERIFICATION & REVIEW BTNS, IMGS CONTAINER
//                 : Hides: DEFAULT PANEL, VERIFICATION PANEL, ADD NEW OBSERVATION INFO PANEL
// "report-issue"        : Shows: VERFICATION PANEL
//                   Hides: DEFAULT PANEL, DATA PANEL, IMGS CONTAINER, ADD NEW OBSERVATION INFO PANEL
// "add-observation": Shows: ADD NEW OBSERVATION INFO PANEL
//                   Hides: DEFAULT PANEL, DATA PANEL, VERIFCATION & REVIEW BTNS, IMGS CONTAINER
// "ground-truth-btns"
// "type-review-box"
// "reviews-confirmation"
// "reviews-container"
function toggleLeftPanelView(elementId) {

  if (elementId != "all") {
    $("#info > div").not($("#" + elementId)).addClass('d-none');
    $('#' + elementId).removeClass('d-none');
  }

  // exceptions
  // let footer = document.getElementById('attribution');
  // footer.classList.remove('d-none');

  // process the attribution
  attributionLeft = document.getElementById("attribution").style["left"];

  if (attributionLeft == "27em") {
    document.getElementById("attribution").style["left"] = "0em";
    document.getElementById("year-slider").style["left"] = "0em";
    document.getElementById("legend").style["left"] = "0em";

  } else {

    document.getElementById("attribution").style["left"] = "27em";
    document.getElementById("year-slider").style["left"] = "27em";
    document.getElementById("legend").style["left"] = "27em";

  }


  if (elementId == "info-default") {
    document.getElementById('ground-truth-btns').classList.remove('d-none');
  }
  if (elementId == "report-issue") {
    document.getElementById('ground-truth-btns').classList.remove('d-none');
    // document.getElementById('report-issue-btn').classList.toggle('d-none');
    // document.getElementById('add-review-btn').classList.toggle('d-none');
    // document.getElementById('go-back-btn').classList.toggle('d-none');
  }
};

// year_val()
// changes the label of the current selected year for the user to see
function year_val() {
  let selectedYear = document.getElementById('slider-bar').value;
  document.getElementById('year-label').innerHTML = selectedYear;
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
    // let city = 'Seattle';
    // let getVenueSlice = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/venueSlice/${city}`, {
    //   method: 'GET'
    // });
    // let venueSliceData = await getVenueSlice.json();

    let cityList = ['Seattle', 'Atlanta', 'Cleveland', 'Nashville']
    let venueData = [];
    for (let i = 0; i < cityList.length; i++) {
      let city = cityList[i];
      let getVenueData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/venueSlice/${city}`, {
        method: 'GET'
      });
      getVenueData = await getVenueData.json();
      venueData = venueData.concat(getVenueData);
    }
    return toGEOJSON(venueData);
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
    'id': (type == 'observation') ? 'observation-legend' : 'venue-legend',
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
  //   'id': (type == 'observation') ? 'observation-legend' : 'venue-legend',
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


  var layers = map.getStyle().layers;

};

// assign switch layer function for all radio button inputs
for (var i = 0; i < layerList.length; i++) {
  layerList[i].onclick = switchLayer;
};

// function slide-in left panel
function viewLeftPanel(e) {

  console.log("test");
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
  let validateObservation = document.getElementById('report-issue-btn');

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
      toggleLeftPanelView('report-issue');
      if( document.getElementById('info').classList.contains("leftCollapse")){
       
      document.getElementById('info').classList.toggle('leftCollapse');}
    }
  });
};

// if a specific locality is selected, recenter the map to that locality

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


let localityFilterBtn = document.getElementById("localityFilterBtn");
localityFilterBtn.addEventListener('click', function () {
  let localityList = document.getElementById('localityList');
  localityList.classList.remove('d-none');

  let codeDescriptorList = document.getElementById('codeDescriptorList');
  codeDescriptorList.classList.add('d-none');
});


Object.entries(localities).forEach(locality => {

  let localityItem = document.createElement("li");

  localityName = locality[0].charAt(0).toUpperCase() + locality[0].slice(1);
  localityItem.innerHTML = '<a class="dropdown-item" href="#">' + localityName + '</a>';

  localityItem.addEventListener('click', function handleClick(event) {

    lName = this.innerText.toLowerCase();
    map.flyTo({
      center: localities[locality[0]].center,
      zoom: localities[locality[0]].zoom,
      speed: 0.9,
      pitch: 75,
      bearing: -25,
      essential: true
    });

    localityList.classList.add('d-none');

  });

  localityList.appendChild(localityItem);

});



function logInCheck() {


  // let logInView = document.getElementById('logInBtn');

  if (document.getElementById('logInBtn').classList.contains("d-none")) {
      // if contains display none, means that user is logged in
      // toggleLeftPanelView('report-issue');

  // // if left panel is close
  // if (document.getElementById('info').classList.contains('leftCollapse')) {
  //     document.getElementById('info').classList.toggle('leftCollapse');
  // }
  return true;
  } else {
      let alert = document.getElementById("alert-modal");
      let alertText = document.getElementById("alert-text");
      alertText.innerHTML = "Please log in before making any contribution to this geospatial platform.";
      let alertModal = new bootstrap.Modal(alert);
      alertModal.show();

      return false;
      
  }





  // let signInView = document.getElementById('logInBtn');
  // // if left panel is closed
  // if (document.getElementById('info').classList.contains('leftCollapse')) {
  //   let collapseState = document.getElementById('info').classList.toggle('leftCollapse');
  //   document.getElementById('info-close-btn').classList.toggle('info-btn-collapse');
  //   let btnImg = document.getElementById('leftPanelArrow');
  //   if (collapseState) {
  //     btnImg.src = './assets/imgs/open-arrow.svg';
  //   } else {
  //     btnImg.src = './assets/imgs/back-btn.svg';
  //   }
  // }

  // if (signInView.classList.contains('d-none')) {
  //   // if contains display none, means that user is logged in
  //   toggleLeftPanelView('report-issue');
  //   return true;
  // } else {
  //   alert('Please sign in through Google first!');
  // }
  // return false;
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


// add div for the codes corresponding to selected year on the map
function code_div(codes, venueSlices, year) {

  let codeFilterBtn = document.getElementById("damron-code-btn");
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



    // for each code_div add event listener on click to add filter features of the map
    codeItem.addEventListener('click', function () {

      codeParent.classList.add('d-none');
      map.setFilter('data', ['in', code.code, ['get', 'codedescriptorlist']]);

      // remove 3D layer
      if (map.getLayer('custom-layer')) {
        map.removeLayer('custom-layer');
      };
      if (map.getLayer('poi-labels')) {
        map.removeLayer('poi-labels');
        map.removeSource('venues');
      };

      fetch('assets/CodeLookup.json')
        .then((response) => response.json())
        .then((codeLookup) => {
          let codefilter = [];
          codeLookupList = Object.values(codeLookup);
          codefilter = codeLookupList.filter(function (feature) {
            return feature.Descriptor == code.code
          })
          console.log(codefilter[0][year])
          let result = [];
          venueSlices.features.filter(function (feature) {
            if (Array.isArray(feature.properties.codedescriptorlist) && feature.properties.codedescriptorlist.includes(codefilter[0][year])) {
              result.push(feature);
            }
          });
          console.log(result)
          addCones(result, false);
        });
    })
    categoryMenu.appendChild(codeItem);

  });



  ///////////////////////////////clear function///////////////////////////////////////////
  let divider = document.createElement("li");
  divider.innerHTML = '<hr class="dropdown-divider">';
  let clear = document.createElement("li");
  clear.classList.add("metaDescriptor");
  clear.setAttribute("id", "clear-button");
  // clear.classList.add('');
  clear.innerHTML = '<a class="dropdown-item clear-button" title="Clear all selected filters" href="#"> Clear </a>';

  clear.addEventListener('click', function () {
    codeParent.classList.add('d-none');

    map.setFilter('data', undefined);
    // map filter of single year selected by the user
    map.setFilter('data', ["==", ['number', ['get', 'year']], year]);
    // let selectionDiv = document.getElementById('dropdown-container');
    // selectionDiv.classList.toggle('d-none');
    // remove 3D layer
    if (map.getLayer('custom-layer')) {
      map.removeLayer('custom-layer');
    };
    if (map.getLayer('poi-labels')) {
      map.removeLayer('poi-labels');
      map.removeSource('venues');
    };
    let onScreenData = venueSlices.features.filter(function (feature) {
      return feature.properties.year == year
    });
    console.log(onScreenData);
    addCones(onScreenData, false);

  });

  codeParent.appendChild(divider);
  codeParent.appendChild(clear);

  ///////////////////////////////clear function///////////////////////////////////////////

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
// Requests uses a location bias and location names to search (similar to a google search)
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

function addLabels(data) {
  let result = {}
  result.type = "FeatureCollection";
  result.features = [];
  for (var id in data) {
    result.features.push(data[id])
  }
  console.log(result)

  // added by Bo
  // var mapLayer = map.getLayer('venues');

  // if(typeof mapLayer !== 'undefined') {
  //   // Remove map layer & source.
  //   map.removeLayer('custom-layer').removeSource('venues');
  // }


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


function addCones(data, active) {

  if (data.length == 0) {
    document.getElementById("year-notes").innerHTML = "No venues of this year have been found in our database."
  } else {
    document.getElementById("year-notes").innerHTML = "";
  }

  addLabels(data);
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
      let geometry = new THREE.ConeGeometry(15, 40, 64);
      // let geometrySup = new THREE.CylinderGeometry(1, 1, 80, 32);

      let material = new THREE.MeshPhysicalMaterial({
        flatShading: true,
        color: '#D3B1C2',
        transparent: true,
        opacity: 1
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

      let green = new THREE.MeshPhysicalMaterial({
        flatShading: true,
        color: 'green',
        // transparent: true,
        // opacity: 0.5
      });

      let materialOnHover = new THREE.MeshPhysicalMaterial({
        flatShading: true,
        color: '#69c3bb',
        transparent: true,
        opacity: 1
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

      // Bo: temporarily hide the bar under the cone.
      // let lineTemplate = new THREE.Mesh(geometrySup, material);
      // lineTemplate = tb.Object3D({
      //   obj: lineTemplate,
      //   units: 'meters'
      // }).set({
      //   rotation: {
      //     x: -90,
      //     y: 0,
      //     z: 0
      //   }
      // });

      data.forEach(function (datum) {
        // longitude, latitude, altitude
        let cone = coneTemplate.duplicate();
        cone.setCoords([datum.geometry.coordinates[0], datum.geometry.coordinates[1], 20]);
        // Bo: Attach properties to each cone.
        cone.userData["properties"] = datum.properties

        // test for changing color based on confidential levels.
        // cone.children[0].material.color.set("yellow");
        tb.add(cone);
        // tb.add(line);
      })



      // tb.repaint();

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
          // toggleLeftPanelView('info-default');
          // document.getElementById('info').classList.toggle('leftCollapse');
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

// this can be used to colorize the venue based on confidence level.
let colorizeVenueCbx = document.getElementById('reliability-switch');

colorizeVenueCbx.addEventListener('click', function () {

  if (this.checked) {

    tb.world.children.forEach(feature => {
      if (feature.type == 'Group') {
        feature.children[0].material.color.set("green");
        console.log(feature.userData.properties.placetype);
      }

    })
  }
  else {

    tb.world.children.forEach(feature => {
      if (feature.type == 'Group') {
        feature.children[0].material.color.set("red");
      }
    })
  }

  tb.repaint();

});


let colorizeObservationCbx = document.getElementById('confidency-switch');

colorizeObservationCbx.addEventListener('click', function () {

  if (this.checked) {

    tb.world.children.forEach(feature => {
      if (feature.type == 'Group') {
        feature.children[0].material.color.set("green");
        console.log(feature.userData.properties.placetype);
      }

    })
  }
  else {

    tb.world.children.forEach(feature => {
      if (feature.type == 'Group') {
        feature.children[0].material.color.set("red");
      }
    })
  }

  tb.repaint();

});


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




function loadOptions(data) {
  let dataSlice = [
    [],
    [],
    [],
    [],
    []
  ];
  console.log(data);
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
  console.log(dataSlice);
  for (let data of dataSlice) {
    data.pop();
  }
  addCheckBox('#collapseEntry', dataSlice[0])
  addCheckBox('#collapseUser', dataSlice[1])
  addCheckBox('#collapseAmenity', dataSlice[2])
  addCheckBox('#collapseCaution', dataSlice[3])
  addCheckBox('#collapseOrganization', dataSlice[4])

  // addAutoComplete('#autoEntry', dataSlice[0]);
  // addAutoComplete('#autoUser', dataSlice[1]);
  // addAutoComplete('#autoAmenity', dataSlice[2]);
  // addAutoComplete('#autoCaution', dataSlice[3]);
  // addAutoComplete('#autoOrganization', dataSlice[4]);
}

function addCheckBox(id, data) {
  let mainCategory = document.querySelector(id);
  for (var descriptor of data) {
    let container = document.createElement('div');
    container.classList.add('form-check');
    let box = document.createElement('input');
    box.classList.add('form-check-input');
    box.setAttribute('type', 'checkbox');
    box.setAttribute('id', descriptor);
    box.setAttribute('value', descriptor);
    box.setAttribute('name', 'myCheckBoxes');
    let label = document.createElement('label');
    label.classList.add('form-check-label');
    label.setAttribute('for', descriptor);
    label.textContent = descriptor;
    container.appendChild(box);
    container.appendChild(label);
    mainCategory.appendChild(container);
  }
}
function addAutoComplete(id, data) {
  new Autocomplete(id, {
    search: input => {
      if (input.length < 1) {
        return []
      }
      return data.filter(option => {
        return option.toLowerCase()
          .includes(input.toLowerCase())
      })
    }
  });
}


// Add category options in add missing venues
// function addCategory(category, data) {
//   category.innerHTML = '';
//   for(var object of data) {
//     let option = document.createElement('option');
//     option.value = object;
//     option.innerHTML = object;
//     category.appendChild(option);
//   }
// }

////////////////////////////////////////////////////////////////////////////////////
// MAP ON LOAD
map.on('style.load', async function () {

  // load data
  // on slider change
  let defaultYear = parseInt(document.getElementById('slider-bar').value);

  let verifiedData = await displayData();
  addDataLayer(verifiedData);
  // once the data is added,d filter the data with the year value.
  map.setFilter('data', ["==", ['number', ['get', 'year']], defaultYear]);

  // observation data
  let observations = await getObservations();
  let venues = await getVenueSlice();

  addAccordionLayer(observations, 'observation');
  // addAccordionLayer(venues, 'venue-slice');  // Bo: venue has already been added.

  // load all code data from database
  let code_data = await allCodes();
  loadOptions(code_data);
  let defaultCodes = codeIncludes(code_data, defaultYear)
  code_div(defaultCodes, verifiedData, defaultYear);
  let active = false;
  // three js 3D object
  let onScreenData = map.getSource('data')._data.features;
  addCones(onScreenData, active);



  // filter data based upon input

  let years = document.getElementById('slider-bar');

  years.addEventListener('input', async function (e) {
    let selectYear = parseInt(years.value);

    // filter map view to selected year
    // map.setFilter('data', ["==", ['number', ['get', 'year']], selectYear]);

    let filteredYearData = venues.features.filter(function (feature) {
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
    console.log(filteredYearData);
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
  let selectYear = document.getElementById('slider-bar').value;
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


   // console.log("data click");
    // get points that are within the boundary for observations
    // get points that are within the boundary for unverified venues

    // Bo: Perhaps highlight the nearby and label their names.
    if (map.getLayer('nearby-observations')) {
      map.removeLayer('nearby-observations');
      map.removeSource('nearby-observations');
    }


    displayNearbyObservations(observations, e);

    // marker.remove();

    if (document.getElementById('info-default').classList.contains('d-none') ) {
      let collapseState = document.getElementById('info').classList.toggle('leftCollapse');
      toggleLeftPanelView('info-default');
    } else {
        if(document.getElementById('info').classList.contains('leftCollapse')){
          document.getElementById('info').classList.toggle('leftCollapse');
          toggleLeftPanelView('info-default');
        }
    }
  
    // toggleLeftPanelView('info-default');

    // load clicked marker info on left panel
   

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

  async function submitPassword(e) {
    try {

      let passphraseAttempts = document.querySelectorAll('.passphrase');
      let formalizedPassphraseAttempt = "";


      passphraseAttempts.forEach(passphraseAttempt => {
        formalizedPassphraseAttempt += passphraseAttempt.value.toLowerCase() + " ";
      });

      formalizedPassphraseAttempt = formalizedPassphraseAttempt.split(' ').sort().join(' ').trim();

      let getResult = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/passphraseCheck/${formalizedPassphraseAttempt}`, {
        method: 'GET'
      });
      let result = await getResult.json();
      if (result[0]['Result'] == '0') {


        document.getElementById("login-cls-btn").click();

        let alert = document.getElementById("alert-modal");
        let alertText = document.getElementById("alert-text");
        alertText.innerHTML = "Log in successfully！";
        let alertModal = new bootstrap.Modal(alert);
        alertModal.show();

        window.setTimeout(function () {
          document.getElementById("alert-cls-btn").click();
        }, 1500);


        document.getElementById('logInBtn').classList.toggle('d-none');
        document.getElementById('logOutBtn').classList.toggle('d-none');


      } else if (result[0]['Result'] == '1') {

        let alert = document.getElementById("alert-modal");
        let alertText = document.getElementById("alert-text");
        alertText.innerHTML = "Incorrect passphrase, please try again.";
        let alertModal = new bootstrap.Modal(alert);
        alertModal.show();

        let passphrases = document.getElementsByClassName("passphrase");
        passphrases[0].value = "";
        passphrases[1].value = "";
        passphrases[2].value = "";

      } else {
        console.log('error.')
      }
    } catch (err) {
      console.log(err);
    }
  }

  document.getElementById('login-btn').addEventListener('click', submitPassword);



  // go back button
  document.getElementById('go-back-btn').addEventListener('click', function () {

    console.log("go back");

    if (!(document.getElementById('info-default').classList.contains('d-none'))) {
  
      toggleLeftPanelView('info-default')
      if (!document.getElementById('info').classList.contains('leftCollapse')){
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
      let yearSlider = document.getElementById('year-api');
      let yearText = document.getElementById('year-text-label');
      let checkboxes = document.querySelectorAll('input[name=myCheckBoxes]:checked');
      for (let box of checkboxes) {
        box.checked = false;
      }
      yearSlider.value = 2005;
      yearText.textContent = 'Year: ' + yearSlider.value;


    }
  })

  // validation button
  // toggleview
  // document.getElementById('report-issue-btn').addEventListener('click', function() {
  //   toggleLeftPanelView('report-issue');
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
    toggleLeftPanelView('legend');
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


  //footer animation


  // Change the cursor to a pointer when the it enters a feature in the 'circle' layer.
  map.on('mouseenter', 'data', function () {
    map.getCanvas().style.cursor = 'pointer';
  });
  // Change it back to a pointer when it leaves.
  map.on('mouseleave', 'data', function () {
    map.getCanvas().style.cursor = '';
  });

  // If these two layers were not added to the map, abort
  if (!map.getLayer('observation-legend') || !map.getLayer('venue-legend')) {
    return;
  }
  // Enumerate ids of the layers.
  let observationLegendBtn = document.getElementById('observation-legend');
  let venueLegendBtn = document.getElementById('venue-legend');
  const toggleableLayerIds = [observationLegendBtn, venueLegendBtn];

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

  // $('#loader').fadeOut("slow");


});