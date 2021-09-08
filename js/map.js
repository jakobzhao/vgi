mapboxgl.accessToken = config.accessToken;

var map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/light-v10', // style URL
  center: [-122.33, 47.60], // starting position [lng, lat]
  zoom: 13, // starting zoom
  logoPosition: 'bottom-right',
  attributionControl: false,
  antialias: true,
  hash: true
});


// add map navigation controls
//
// map.addControl(new mapboxgl.AttributionControl({
//   customAttribution: 'University of Washington | HGIS Lab',
//   logoPosition: 'bottom-right'
// }));
// map.addControl(new mapboxgl.NavigationControl());
// temporarily remove the logo.
$(".mapboxgl-ctrl-logo").remove();

document.getElementsByClassName('mapboxgl-ctrl-top-right')[0].classList.add('navi-ctrls');
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
  let imgDiv = document.getElementById('imgs-container');
  let viewBtn = document.getElementById('validate-observation-btn');
  // validate observation form buttons and div
  let hiddenDiv = document.getElementById('validate-observation');
  let backBtn = document.getElementById('go-back-btn');

  imgDiv.classList.toggle(toggleClass);
  hiddenDiv.classList.toggle(toggleClass);
  defaultDiv.classList.toggle(toggleClass);
  viewBtn.classList.toggle(toggleClass);
  backBtn.classList.toggle(toggleClass);
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
      let getVenueData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/venues/${city}`, {method: 'GET'});
      let venueData = await getVenueData.json();
      return toGEOJSON(venueData);
    } catch(error) {
        console.log(error);
    }
};

// getVenueSlice
// Obtain data from database that contains all the venue slices in database
async function getVenueSlice() {
  try {
    let city = 'Seattle';
    let getVenueSlice = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/venueSlice/${city}`, {method: 'GET'});
    let venueSliceData = await getVenueSlice.json();
    return toGEOJSON(venueSliceData);
    // return toGEOJSON(venueSliceData);
  } catch (err) {
    console.log(err);
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
            // convert code string to javascript array
            if(properties == 'codedescriptorlist' && data.codedescriptorlist != null) {
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
    map.loadImage('./assets/imgs/marker.png', function(error, image){
      if (error) throw error;
      map.addImage('init-marker', image, {sdf:true});
    });
    map.loadImage('./assets/imgs/red-marker.png', function(error, image){
      if (error) throw error;
      map.addImage('red-marker', image, {sdf: true});
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
      'paint':{
        'icon-opacity': 0,
        'icon-color': '#ff6262'
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
};

// assign switch layer function for all radio button inputs
for (var i = 0; i < layerList.length; i++) {
  layerList[i].onclick = switchLayer;
};

function leftPanelClearCheck(checkType) {
  // remove d-none from imgs container, info-default, hide add-observation, validation-btns
  let imgsContainer = document.getElementById('imgs-container');
  let infoDefault  = document.getElementById('info-default');
  let validationBtns = document.getElementById('validation-btns');
  let addObservation = document.getElementById('add-observation');
  let yearSlider = document.getElementById('slider-time');

  if (checkType == "remove") {
    imgsContainer.classList.remove('d-none');
    infoDefault.classList.remove('d-none');
    validationBtns.classList.remove('d-none');
    // add d-none from add-observation
    addObservation.classList.add('d-none');
    yearSlider.classList.add('d-none');
  } else {
    imgsContainer.classList.add('d-none');
    infoDefault.classList.add('d-none');
    validationBtns.classList.add('d-none');
    // add d-none from add-observation
    addObservation.classList.remove('d-none');
  };
};


// function slide-in left panel
function viewLeftPanel(e) {
    let dataCanvas = document.getElementById('info');
    dataCanvas.classList.remove('slide-out');
    dataCanvas.classList.add('slide-in');
    dataCanvas.classList.remove('hidden');

    // parse the codes to increase readability
    let codeString = "";
    let codes = e.properties.codedescriptorlist;
    for(let i=0; i < codes.length; i++) {
      if(codes[i] !== '[' && codes [i] !== '"' && codes[i] !== '.' && codes[i] !== ']' && codes[i] !== "'") {
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
  return ( (string != "null") ? string : 'data unavailable');
};
// left panel functionalities (validate observation marker view, selected marker view, map zoom to selected point)
async function addLeftPanelActions(feature, marker) {
  map.flyTo({
    center: feature.geometry.coordinates,
    zoom: 16.5,
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
  let reviewParent = document.getElementById('reviews-container');

  for(let i = 0; i < reviewData.length; i++) {
    let reviewDiv = document.createElement('div');
    reviewDiv.innerHTML = reviewData[i].content;
    reviewDiv.classList.add('review-box');
    reviewParent.append(reviewDiv);
  }
}
// add 3-D extrusions
function addExtrusions(e, hover) {
  // get the data points that stack on top of each other within the selected year range
  let layerData = map.queryRenderedFeatures([e.point.x, e.point.y], {layers: ['data']});
  // sort data by year (from lowest to highest)
  layerData.sort( (a,b) => {
    return parseFloat(a.properties.year) - parseFloat(b.properties.year);
  });

  const polygonRadius = 0.0002;

  var scaleTest = chroma.scale('OrRd').colors(12);
  let yearBlockData = {
    'type': 'FeatureCollection',
    'features': layerData.map( (location,index) => ({
      'type':'Feature',
      'properties': {
        'name': location.properties.observedvenuename,
        'year': location.properties.year,
        'height': (((index == 0) ?  50 : (index+1)*150-45) + 145 ),
        'base': ((index == 0) ?  50 : (index+1)*150-10),
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
      },
      'id': layerData[0].id
    }))
  };

  map.addLayer({
    'id': 'year-block',
    'type': 'fill-extrusion',
    'source': {'type':'geojson', 'data': yearBlockData, generateId: true, 'tolerance': 0},
    'paint': {
      'fill-extrusion-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        'red',
        'pink'
        ],
      'fill-extrusion-base': {'type': 'identity', 'property': 'base'},
      'fill-extrusion-height': {'type': 'identity', 'property': 'height'},
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': false,
    }
  });
};

// add div for the codes corresponding to selected year on the map
function code_div(data, locationData, year) {
  let code_parent = document.getElementById('dropdown');
  // clear everything in div first (in case already populated with existing data)
  while(code_parent.firstChild) {
    code_parent.removeChild(code_parent.lastChild);
  };

  let standard = document.createElement('div');
  standard.innerHTML = "CLEAR";
  standard.title = "Clear all selected filters";
  standard.addEventListener('click', function() {
    map.setFilter('data', undefined);
    // map filter of single year selected by the user
    map.setFilter('data', ["==", ['number', ['get', 'year'] ], year]);
    let selectionDiv = document.getElementById('dropdown-container');
    selectionDiv.classList.toggle('d-none');
    // remove 3D layer
    if(map.getLayer('custom-layer')) {
      map.removeLayer('custom-layer');
    };
    let onScreenData = locationData.features.filter(function(feature) {
      return feature.properties.year == year
    });
    console.log(onScreenData);
    addCones(onScreenData, false);
  });

  standard.classList.add('dropdown-div');
  code_parent.appendChild(standard);

  // for each object in data
  for(let code in data){
    let singleCode = data[code];
    let codeDiv = document.createElement('div');
    codeDiv.innerHTML = singleCode.code;
    codeDiv.title = singleCode.name;

    // for each code_div add event listener on click to add filter features of the map
    codeDiv.addEventListener('click', function() {
      map.setFilter('data', ['in', singleCode.code, ['get', 'codedescriptorlist']]);
      let selectionDiv = document.getElementById('dropdown-container');
      selectionDiv.classList.toggle('d-none');

      // remove 3D layer
      if(map.getLayer('custom-layer')) {
        map.removeLayer('custom-layer');
      };

      let result = [];
      locationData.features.filter(function(feature) {
        if(Array.isArray(feature.properties.codedescriptorlist) && feature.properties.codedescriptorlist.includes(singleCode.code)) {
          result.push(feature);
        }
      });
      addCones(result, false);
    })

    // add corresponding style here
    codeDiv.classList.add('dropdown-div');
    code_parent.appendChild(codeDiv);

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
    if (status == google.maps.places.PlacesServiceStatus.OK && results) {
      placeId = results[0].place_id;
      // call another function to set
      let imgChild = setImgURL(service, placeId);
      imgParent.appendChild(imgChild);
    } else {
      let imgChildError = document.createElement('img');
      imgChildError.src = './assets/imgs/img-placeholder.svg';
      imgParent.appendChild(imgChildError);
      console.log(status);
    }

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
    if(status == google.maps.places.PlacesServiceStatus.OK && result.hasOwnProperty('photos') ){
      let imgUrl = result.photos[0].getUrl(({maxWidth: 1000, maxHeight: 1250}));
      imgElement.src = imgUrl;
    } else {
      imgElement.src = './assets/imgs/img-placeholder.svg';
    }
  });
  return imgElement;
};

function addCones(data, active) {
  map.addLayer({
    id: 'custom-layer',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function(map, mbxContext){
        mbxContext = map.getCanvas().getContext('webgl');
        window.tb = new Threebox(
            map,
            mbxContext,
            {defaultLights: true}
        );

        // initialize geometry and material of our cube object
        let geometry = new THREE.ConeGeometry(20, 40, 32);

        let material = new THREE.MeshPhysicalMaterial( {
            flatShading: true,
            color: '#8bd5ee',
            transparent: true,
            opacity: 0.5
        });

        let materialOnClick = new THREE.MeshPhysicalMaterial( {
          flatShading: true,
          color: '#ff6262',
          transparent: true,
          opacity: 0.5
        });

        let coneTemplate = new THREE.Mesh(geometry, material);
        coneTemplate = tb.Object3D({obj:coneTemplate, units:'meters'}).set({rotation :  {x: -90, y: 0, z: 0}});

        data.forEach(function (feature) {
          // longitude, latitude, altitude
          let cone = coneTemplate.duplicate().setCoords([feature.geometry.coordinates[0], feature.geometry.coordinates[1], 20] );

          tb.add(cone)
        })

        var highlighted = [];

        //add mousing interactions
        map.on('click', function(e){

            // Clear old objects
            highlighted.forEach(function(h) {
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
    },

    render: function(gl, matrix){
      tb.update();
    }
  });
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
  code_div(defaultCodes, obs_data, defaultYear);

  let active = false;
  // three js 3D object
  let onScreenData = map.getSource('data')._data.features;
  addCones(onScreenData, active);

  // filter data based upon input
  // let years = document.querySelectorAll('.year-slider');
  let years = document.getElementById('single-input');

  years.addEventListener('input', async function(e) {
    let selectYear = parseInt(years.value);
    // filter map view to selected year
    map.setFilter('data', ["==", ['number', ['get', 'year'] ], selectYear ]);

    let filteredYearData = obs_data.features.filter(function(feature) {
      return feature.properties.year == selectYear
    });
    // add 3-d shapes and remove previous existing shapes
    if(map.getLayer('custom-layer')) {
      map.removeLayer('custom-layer');
    };
    // add new custom layer
    addCones(filteredYearData, false);

    let result = codeIncludes(code_data, selectYear);
    // construct div for each damron code available
    code_div(result, obs_data, selectYear);
  })

  // create temporary marker if user wants to validate a location
  var marker = new mapboxgl.Marker({
    draggable:true
  });

  // venue- left dashboard add venues from database
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
        // bootstrap row
        let rowDiv = document.createElement('div');
        rowDiv.classList.add('row', "m-1");
        let venueName = document.createElement('div');
        let venueConfidence = document.createElement('div');
        venueName.classList.add('col');
        venueConfidence.classList.add("col", "col-sm-3");

        let confidence =  parseFloat(localityFeatures[i].properties.confidence);

        venueName.innerHTML = localityFeatures[i].properties.observedvenuename;
        venueConfidence.innerHTML = confidence.toFixed(2);

        rowDiv.appendChild(venueName);
        rowDiv.appendChild(venueConfidence);

        localityParent.appendChild(rowDiv);
        rowDiv.addEventListener('click', function() {
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

  // when click on extrusion
  map.on('click', 'year-block', function(e) {
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
  map.on('mousemove', 'year-block', function(e) {
    if (e.features.length > 0) {
      if (hoveredStateId !== null) {
        map.setFeatureState(
          { source: 'year-block', id: hoveredStateId },
          { hover: false }
          );
      }
      hoveredStateId = e.features[0].id;
        map.setFeatureState(
          { source: 'year-block', id: hoveredStateId },
          { hover: true }
        );
      }
  });

  // change color of extrusion back after mouse leaves
  map.on('mouseleave', 'year-block', () => {
    if (hoveredStateId !== null) {
      map.setFeatureState(
        { source: 'year-block', id: hoveredStateId },
        { hover: false }
      );
    }
    hoveredStateId = null;
  });

  // trigger review/location information on click of location point of map
  map.on('click','data', async function(e) {
    // marker.remove();
    // check for left panel elements still lingering
    leftPanelClearCheck('remove');

    // // clear 3-D year object
    if (typeof map.getLayer('year-block') !== "undefined" ){
      map.removeLayer('year-block');
      map.removeSource('year-block');
    };

    // clear default user accordion view
    document.getElementById('references-container').classList.add('d-none');

    // clear review box is open
    let reviewBox = document.getElementById('type-review-box');
    reviewBox.classList.add('d-none');
    // map.removeLayer('year-block');
    // map.removeSource('year-block');

    // add all left panel actions (including zoom and adding data points)
    let feature = e.features[0];
    // view left panel on data click
    viewLeftPanel(feature);
    addLeftPanelActions(feature, marker);
    // Show close button
    setTimeout(function() {
      document.getElementById('info-close-btn').classList.remove('d-none');
    }, 275);

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
    // ** database only supports location with existing vids
    let vid = parseInt(document.getElementById('vid-review').innerHTML);
    let reviewParent = document.getElementById('reviews-container');

    while(reviewParent.firstChild) {
      reviewParent.removeChild(reviewParent.lastChild);
    };


    document.getElementById('publish-btn').removeEventListener('click', submitNewReview);
    document.getElementById('publish-btn').addEventListener('click', submitNewReview);
    // get all comments of the location
    await getReviews(vid);
    // get all photos of the location by the google API
    getPhotos(feature);
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

  // add new observation
  document.getElementById('addObservationBtn').addEventListener('click', function() {
    // allow left panel to slide in;
    let dataCanvas = document.getElementById('info');
    dataCanvas.classList.remove('slide-out');
    dataCanvas.classList.add('slide-in');
    dataCanvas.classList.remove('hidden');
    document.getElementById('info-close-btn').classList.remove('d-none');
    document.getElementById('references-container').classList.add('d-none');
    document.getElementById('slider-time').classList.add('d-none');
    leftPanelClearCheck('add');
  });

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
  document.getElementById('info-close').addEventListener('click', function(e) {
    // trigger slideout/slide-in btn
    document.getElementById('info-close-btn').classList.add('d-none');
    document.getElementById('info').classList.add('slide-out');
    // reset the form if user closes location information dashboard
    let defaultDiv = document.getElementById('info-default');
    let viewBtn = document.getElementById('validate-observation-btn');
    let hiddenDiv = document.getElementById('validate-observation');
    let backBtn = document.getElementById('go-back-btn');
    let addObs = document.getElementById('add-observation');
    let yearSlider = document.getElementById('slider-time');
    yearSlider.classList.remove('d-none');

    if(defaultDiv.classList.contains('d-none')) {
      defaultDiv.classList.remove('d-none');
      viewBtn.classList.remove('d-none');
      hiddenDiv.classList.add('d-none');
      backBtn.classList.add('d-none');
      addObs.classList.add('d-none');
    }

    // clear marker

    if (typeof map.getLayer('selectedMarker') !== "undefined" ){
      marker.remove();
      map.removeLayer('selectedMarker');
      map.removeSource('selectedMarker');
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

})


// sign in
