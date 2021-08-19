mapboxgl.accessToken = 'pk.eyJ1Ijoia2V2aW5rb2NodW55dSIsImEiOiJja3BkdDRkMzYxaHJiMnBvMWNlZ21iZm12In0.EgOe8AAJuApJrrEDtc62IQ';
var map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/light-v10', // style URL
  center: [-122.33, 47.60], // starting position [lng, lat]
  zoom: 12 // starting zoom
});

// geocoding search bar
let geocoder =new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

// year_val()
// changes the label of the current selected year for the user to see
function year_val() {
  let selectedYear = document.getElementById('single-input').value;
  document.getElementById('left-label').innerHTML = selectedYear;
}

// toggle left dashboard to default and edit view
function toggleView(toggleClass) {
  // default location information buttons and div
  let defaultDiv = document.getElementById('info-default');
  let viewBtn = document.getElementById('validate-observation-btn');
  // validate observation form buttons and div
  let hiddenDiv = document.getElementById('validate-observation');
  let backBtn = document.getElementById('go-back-btn');

  hiddenDiv.classList.toggle(toggleClass);
  defaultDiv.classList.toggle(toggleClass);
  viewBtn.classList.toggle(toggleClass);
  backBtn.classList.toggle(toggleClass);
};

// confirmedVenues
// Obtain data from database that contains all the venues in the city
async function confirmedVenues() {
  try {
    let getVenues = await fetch('https://lgbtqspaces-api.herokuapp.com/api/all-venues', {method: 'GET'});
    let venueData = await getVenues.json();
    return venueData;
  } catch (err) {
    console.log(err);
  }
};

function venueList(data){
  for (let i=0; i < data.length; i++) {
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
    let getCodes = await fetch('https://lgbtqspaces-api.herokuapp.com/api/all-codes', {method: 'GET'});
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
      'years': Object.keys(data[i]).filter(function(key) {return data[i][key] == 1})
    };
  }
  return sortedResult;
};

// getReviews
// Obtain data from database containing information for all the reviews of a specific location
async function getReviews(vid) {
  try {
    let id = vid;
    let getReview = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/comment/${id}`, {method: 'GET'});
    let reviewData = await getReview.json();
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
  newReview.append('review',document.getElementById('user-review-input').value);

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
  let timeOutID = setTimeout( function() {reviewCheck.classList.add('d-none')}, 3000);
  timeOutID;
}

// displayData
// Obtain the data from the database given the input values from the year slider
// returns a complete GEOJSON data output that is filtered with the matching dates
async function displayData(){
    try {
      // current city only seattle - expand to user input in the future
      let city = "Seattle";
      let readData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/observations/${city}`, {method: 'GET'});
      let getVenueData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/venues/${city}`, {method: 'GET'});
      let venueData = await getVenueData.json();
      let data = await readData.json();
      data.push(...venueData);
      return toGEOJSON(data);
    } catch(error) {
        console.log(error);
    }
};

// converts json input  to geojson output
function toGEOJSON(data){
    let feature_list = [];
    // for loop
    for (let i = 0; i  < data.length; i++) {
        let temp = {
            "type": "Feature",
            "geometry": {
                "type":"Point",
                "coordinates" : [data[i].longitude,data[i].latitude]
            },
            "properties": getProperties(data[i])
        }
        feature_list.push(temp);
    }
    // add into feature_list
    // combine with geojson final format with feature collection and feature as feature list
    return {"type" : "FeatureCollection",
            "features": feature_list};
};

// getProperties(data)
// Parameters: data - input array elements from JSON
// Returns an object that is to be added onto the geoJSON output
function getProperties(data) {
    let result = {};
    for(const properties in data) {
        if(properties != 'longitude' && properties != 'latitude') {
            result[properties] = data[properties];
        }
    }
    return result;
};

// Add observation data layer onto map
function addDataLayer(obsData) {
    map.loadImage('./assets/imgs/marker.png', function(error, image){
      if (error) throw error;
      map.addImage('init-marker', image, {sdf:true});
    });
    map.loadImage('./assets/imgs/red-marker.png', function(error, image){
      if (error) throw error;
      map.addImage('red-marker', image);
    });

    map.addLayer({
      'id': 'data',
      'type': 'symbol',
      'source': {
        type: 'geojson',
        data: obsData
      },
      'tolerance': 0,
      'layout': {
        'icon-image': 'init-marker',
        'icon-size': 1.3,
        'icon-allow-overlap': true,
        'text-allow-overlap': true
      },
      'paint':{
        'icon-opacity': 0.8,
        'icon-color': '#c6aee7'
      }
    });
};

// basemap switching/styling
var layerList = document.getElementById('menu');
var inputs = layerList.querySelectorAll('#basemap-selection > input');

function switchLayer(layer) {
  var layerId = layer.target.id;
  map.setStyle('mapbox://styles/mapbox/' + layerId);

  // adjust slider text color when changing basemaps
  if(layerId == 'satellite-v9' || layerId == 'dark-v10') {
    document.getElementById('slider-time').setAttribute("style", "color: white;");
  } else {
    document.getElementById('slider-time').setAttribute("style", "color: black;");
  }
};

// assign switch layer function for all radio button inputs
for (var i = 0; i < inputs.length; i++) {
  inputs[i].onclick = switchLayer;
};

// function slide-in left panel
function viewLeftPanel(e) {
    let dataCanvas = document.getElementById('info');
    dataCanvas.classList.remove('slide-out');
    dataCanvas.classList.add('slide-in');
    dataCanvas.classList.remove('hidden');

    // parse the codes to increase readability
    let codeString = "";
    let codes = e.properties.codelist;
    for(let i=0; i < codes.length; i++) {
      if(codes[i] !== '[' && codes [i] !== '"' && codes[i] !== '.' && codes[i] !== ']' && codes[i] !== "'") {
        codeString += codes[i];
      }
    };

    // left panel location information
    document.getElementById('name').innerHTML = e.properties.observedvenuename;
    document.getElementById('year-info').innerHTML = e.properties.year;
    document.getElementById('address').innerHTML = e.properties.address;
    document.getElementById('state').innerHTML = e.properties.state;
    document.getElementById('city').innerHTML = e.properties.city;
    document.getElementById('code').innerHTML = codeString;
    document.getElementById('type').innerHTML = e.properties.category;
    document.getElementById('long').innerHTML = e.geometry.coordinates[0];
    document.getElementById('lat').innerHTML = e.geometry.coordinates[1];

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

// left panel functionalities (validate observation marker view, selected marker view, map zoom to selected point)
async function addLeftPanelActions(feature, marker) {
  map.flyTo({
    center: feature.geometry.coordinates,
    zoom: 14,
    speed: 0.3,
    pitch: 75,
    bearing: -25,
    essential: true
  });

  if (typeof map.getLayer('selectedMarker') !== "undefined" ){
    map.removeLayer('selectedMarker');
    map.removeSource('selectedMarker');
  };

  map.addSource('selectedMarker', {
    "type": 'geojson',
    'data': feature,
    'tolerance': 0
  });

  map.addLayer({
    'id':'selectedMarker',
    'type': 'symbol',
    'source': 'selectedMarker',
    'tolerance': 0,
    'layout': {
      'icon-image': 'red-marker'
      // 'icon-allow-overlap': true,
      // 'text-allow-overlap': true
    }
  });

  // if validate observation is clicked, display movable marker
  let validateObservation = document.getElementById('validate-observation-btn');
  var coordinates = feature.geometry.coordinates.slice();

  validateObservation.addEventListener('click', function() {
    marker.setLngLat(coordinates).addTo(map);

    function onDragEnd() {
      var lngLat = marker.getLngLat();
      document.getElementById('long-edit').value = lngLat.lng;
      document.getElementById('lat-edit').value = lngLat.lat;
    }
    marker.on('dragend', onDragEnd);
  });
};

// create and style all incoming reviews from API request
function constructReviews(reviewData){
  // clear all existing reviews
  let reviewParent = document.getElementById('reviews-container');

  while(reviewParent.firstChild) {
    reviewParent.removeChild(reviewParent.lastChild);
  };

  for(let i = 0; i < reviewData.length; i++) {
    let reviewDiv = document.createElement('div');
    reviewDiv.innerHTML = reviewData[i].review;
    reviewDiv.classList.add('review-box');
    reviewParent.append(reviewDiv);
  }
}

// add 3-D extrusions
function addExtrusions(e) {
  // get the data points that stack on top of each other within the selected year range
  let layerData = map.queryRenderedFeatures([e.point.x, e.point.y], {layers: ['data']});
  // sort data by year (from lowest to highest)
  layerData.sort( (a,b) => {
    return parseFloat(a.properties.year) - parseFloat(b.properties.year);
  });

  const polygonRadius = 0.001;

  var scaleTest = chroma.scale('OrRd').colors(12);

  let yearBlockData = {
    'type': 'FeatureCollection',
    'features': layerData.map( (location,index) => ({
      'type':'Feature',
      'properties': {
        'name': location.properties.observedvenuename,
        'year': location.properties.year,
        'height': (((index == 0) ?  100 : (index+1)*150-45) + 145 ),
        'base': ((index == 0) ?  100 : (index+1)*150-10),
        'paint': scaleTest[index]
      },
      'geometry': {
        'type': 'Polygon',
        'coordinates': [
          [
            [location.geometry.coordinates[0] - polygonRadius, location.geometry.coordinates[1] - polygonRadius],
            [location.geometry.coordinates[0] + polygonRadius, location.geometry.coordinates[1] - polygonRadius],
            [location.geometry.coordinates[0] + polygonRadius, location.geometry.coordinates[1] + polygonRadius],
            [location.geometry.coordinates[0] - polygonRadius, location.geometry.coordinates[1] + polygonRadius],
            [location.geometry.coordinates[0] - polygonRadius, location.geometry.coordinates[1] - polygonRadius]
          ]
        ]
      }
    }))
  };

  map.addLayer({
    'id': 'year-block',
    'type': 'fill-extrusion',
    'source': {'type':'geojson', 'data': yearBlockData, 'tolerance': 0},
    'paint': {
      'fill-extrusion-color': {'type': 'identity', 'property': 'paint'},
      'fill-extrusion-base': {'type': 'identity', 'property': 'base'},
      'fill-extrusion-height': {'type': 'identity', 'property': 'height'},
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': false,
    }
  });
};

// add div for the codes corresponding to selected year on the map
function code_div(data, year) {
  let code_parent = document.getElementById('dropdown');

  // clear everything in div first (in case already populated with existing data)
  while(code_parent.firstChild) {
    code_parent.removeChild(code_parent.lastChild);
  };

  let standard = document.createElement('div');
  standard.innerHTML = "[BACK] Revert back to no code filter";
  standard.addEventListener('click', function() {
    map.setFilter('data', undefined);
    // map filter of single year selected by the user
    map.setFilter('data', ["==", ['number', ['get', 'year'] ], year ]);

  });

  standard.classList.add('dropdown-item');
  code_parent.appendChild(standard);

  // for each object in data
  for(let code in data){
    let single_code = data[code];
    let code_div = document.createElement('div');
    code_div.innerHTML = single_code.code + " -   " + single_code.name;

    // for each code_div add event listener on click to add filter features of the map
    code_div.addEventListener('click', function() {
      map.setFilter('data', ['in', single_code.code, ['get', 'codelist']]);
    })

    // add corresponding style here
    code_div.classList.add('dropdown-item');
    code_parent.appendChild(code_div);

  };
}

// obtain damron codes of corresponding year
function codeIncludes(codeData, year){
  let result = {};
  // Obtain damron codes of corresponding year
  for(let codeInfo in codeData) {
    let codeObj = codeData[codeInfo];
    if(codeObj.years.includes(year.toString())){
      result[codeInfo] = codeObj;
    }
  }
  return result;
}

// getPhotos
// Function that utilizes the Google Maps and Places Javascript Library to obtain a default image of a location
// Requets uses a location bias and location names to search (similar to a google search)
// Parameters:
//  feature: javascript object that contains complete data of a clicked location
function getPhotos(feature){
  let imgParent = document.getElementById('imgs-container');
  let locationBias = new google.maps.LatLng(feature.geometry.coordinates[1] , feature.geometry.coordinates[0]);
  // set request data location name and set location bias
  let request = {
    query: feature.properties.observedvenuename,
    fields: ["place_id"],
    locationBias: locationBias
  }
  let placeId;
  // send request to get placeid
  let service = new google.maps.places.PlacesService(imgParent);
  service.findPlaceFromQuery(request, (results, status) => {
    console.log(results);
    placeId = results[0].place_id;
    console.log(placeId);
    // call another function to set
    let imgChild = setImgURL(service, placeId);
    imgParent.appendChild(imgChild);
  });
};

function setImgURL(service, placeId){
  // new request to get imageURL
  let newRequest = {
    placeId : placeId,
    fields: ["photos"]
  };
  // get details of location
  let imgElement = document.createElement('img');
  service.getDetails(newRequest, (result, status) => {
   let imgUrl = result.photos[0].getUrl(({maxWidth: 1000, maxHeight: 1250}));
   imgElement.src = imgUrl;
  });
  return imgElement;
};



////////////////////////////////////////////////////////////////////////////////////
// MAP ON LOAD
map.on('style.load', async function() {
  // load data
  // on slider change
  let defaultYear = parseInt(document.getElementById('single-input').value);

  let obs_data = await displayData();
  addDataLayer(obs_data);
  map.setFilter('data', ["==", ['number', ['get', 'year'] ], defaultYear]);

  // load all code data from database
  let code_data = await allCodes();
  let defaultCodes = codeIncludes(code_data, defaultYear)
  code_div(defaultCodes, defaultYear);

  // filter data based upon input
  // let years = document.querySelectorAll('.year-slider');
  let years = document.getElementById('single-input');

  years.addEventListener('input', async function(e) {
    let selectYear = parseInt(years.value);

    // filter map view to selected year
    map.setFilter('data', ["==", ['number', ['get', 'year'] ], selectYear ]);

    let result = codeIncludes(code_data, selectYear);
    // construct div for each damron code available
    code_div(result, selectYear);
  })

  // create temporary marker if user wants to validate a location
  var marker = new mapboxgl.Marker({
    draggable:true
  });

  // initially clears everything in the confirmed venues panel to display nothing
  map.on('movestart', 'data', function() {
    // clear everything in confirmed venue right panel
    let localityParent = document.getElementById('locality-venues');
    while(localityParent.firstChild) {
        localityParent.removeChild(localityParent.lastChild);
    };
  });

  map.on('moveend', function () {
    // split obs data to matching years
    let selectYear = document.getElementById('single-input').value;
    // let yearRight = document.getElementById('input-right').value;
    let localityParent = document.getElementById('locality-venues');

    let localityFeatures = obs_data.features;

    // sort locality features
    localityFeatures.sort( (a,b) => {
      let firstYear = parseFloat(a.properties.year);
      let secondYear = parseFloat(b.properties.year);
      let difference = firstYear - secondYear;
      // if ( difference  == 0 ) {
      //   difference = a.properties.observedvenuename.localeCompare(b.properties.observedvenuename);
      // }
      return difference;
    })

    for(let i = 0; i < localityFeatures.length; i++) {
      if(localityFeatures[i].properties.year == selectYear) {
        if(localityFeatures[i].properties.confidence < 0.85) {
          let localityDiv = document.createElement('div');
          localityDiv.classList.add('m-3');

          localityDiv.innerHTML = localityFeatures[i].properties.observedvenuename + " (" + localityFeatures[i].properties.year + ", " + localityFeatures[i].properties.confidence + " )";
          localityParent.appendChild(localityDiv);

          localityDiv.addEventListener('click', function() {
            viewLeftPanel(localityFeatures[i]);
            addLeftPanelActions(localityFeatures[i], marker);
            // addExtrusions(localityFeatures[i]);
          });
        }
      }
    }

    if(localityParent.firstChild == null) {
      let localityPar = document.createElement('div');
      localityPar.classList.add('m-3');
      localityPar.innerHTML = "No low confidence location nearby."
      localityParent.appendChild(localityPar);
    };
  });

  // trigger review/location information on click of location point of map
  map.on('click','data', async function(e) {
    // marker.remove();
    // // clear 3-D year object
    if (typeof map.getLayer('year-block') !== "undefined" ){
      map.removeLayer('year-block');
      map.removeSource('year-block');
    };

    let reviewBox = document.getElementById('type-review-box');
    reviewBox.classList.add('d-none');
    // map.removeLayer('year-block');
    // map.removeSource('year-block');

    // add all left panel actions (including zoom and adding data points)
    let feature = e.features[0];
    // view left panel on data click
    viewLeftPanel(feature);
    addLeftPanelActions(feature, marker);

    // indicate that this point is a venue
    let venueIndicator = document.getElementById('venue-indicator');
    if(e.features[0].properties.v_id !== undefined) {
      venueIndicator.innerHTML = "this is a confirmed venue";
    } else {
      venueIndicator.innerHTML = '';
    };

    // add extrusions
    addExtrusions(e);

    // add reviews
    // if add review button is clicked, display add review div box
    let addReview = document.getElementById('add-review-btn');
    addReview.addEventListener('click', () =>{
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
    let vid = parseInt(document.getElementById('vid-review').innerHTML);

    document.getElementById('publish-btn').removeEventListener('click', submitNewReview);
    document.getElementById('publish-btn').addEventListener('click', submitNewReview);

    // get all comments of the location
    await getReviews(vid);
    getPhotos(feature);
    // constructReviews(reviewData);
  });

  // helper function to submit new review
  function submitNewReview(e){
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

  // go back button
  document.getElementById('go-back-btn').addEventListener('click', function() {
    toggleView('d-none');
    marker.remove();
  });

  // validation button
  // toggleview
  document.getElementById('validate-observation-btn').addEventListener('click', function() {
    toggleView('d-none');
  })

  // close button
  document.getElementById('info-close').onclick = function() {

    document.getElementById('info').classList.add('slide-out');
    // reset the form if user closes location information dashboard
    let defaultDiv = document.getElementById('info-default');
    let viewBtn = document.getElementById('validate-observation-btn');
    let hiddenDiv = document.getElementById('validate-observation');
    let backBtn = document.getElementById('go-back-btn');

    if(defaultDiv.classList.contains('d-none')) {
      defaultDiv.classList.remove('d-none');
      viewBtn.classList.remove('d-none');
      hiddenDiv.classList.add('d-none');
      backBtn.classList.add('d-none');
    }

    // clear marker
    marker.remove();
    map.removeLayer('selectedMarker');
    map.removeSource('selectedMarker');

    // clear 3-D year object
    map.removeLayer('year-block');
    map.removeSource('year-block');
  }


  // Change the cursor to a pointer when the it enters a feature in the 'circle' layer.
  map.on('mouseenter', 'data', function () {
    map.getCanvas().style.cursor = 'pointer';
  });

  // Change it back to a pointer when it leaves.
  map.on('mouseleave', 'data', function () {
    map.getCanvas().style.cursor = '';
  });

})
