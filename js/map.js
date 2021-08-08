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

// Slider functions
// year_val()
function year_val() {
  let left = document.getElementById('input-left').value;
  let right = document.getElementById('input-right').value;
  document.getElementById('left-label').innerHTML = left;
  document.getElementById('right-label').innerHTML = right;
}

// slider
var inputLeft = document.getElementById("input-left");
var inputRight = document.getElementById("input-right");

var thumbLeft = document.querySelector(".slider > .thumb.left");
var thumbRight = document.querySelector(".slider > .thumb.right");
var range = document.querySelector(".slider > .range");

function setLeftValue() {
  var _this = inputLeft,
    min = parseInt(_this.min),
    max = parseInt(_this.max);

  _this.value = Math.min(parseInt(_this.value), parseInt(inputRight.value) - 1);

  var percent = ((_this.value - min) / (max - min)) * 100;

  thumbLeft.style.left = percent + "%";
  range.style.left = percent + "%";
}

setLeftValue();

function setRightValue() {
  var _this = inputRight,
    min = parseInt(_this.min),
    max = parseInt(_this.max);

  _this.value = Math.max(parseInt(_this.value), parseInt(inputLeft.value) + 1);

  var percent = ((_this.value - min) / (max - min)) * 100;

  thumbRight.style.right = (100 - percent) + "%";
  range.style.right = (100 - percent) + "%";
}
setRightValue();

inputLeft.addEventListener("input", setLeftValue);
inputRight.addEventListener("input", setRightValue);

inputLeft.addEventListener("mouseover", function() {
  thumbLeft.classList.add("hover");
});
inputLeft.addEventListener("mouseout", function() {
  thumbLeft.classList.remove("hover");
});
inputLeft.addEventListener("mousedown", function() {
  thumbLeft.classList.add("active");
});
inputLeft.addEventListener("mouseup", function() {
  thumbLeft.classList.remove("active");
});

inputRight.addEventListener("mouseover", function() {
  thumbRight.classList.add("hover");
});
inputRight.addEventListener("mouseout", function() {
  thumbRight.classList.remove("hover");
});
inputRight.addEventListener("mousedown", function() {
  thumbRight.classList.add("active");
});
inputRight.addEventListener("mouseup", function() {
  thumbRight.classList.remove("active");
});

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
}

// displayData
// Obtain the data from the database given the input values from the year slider
// returns a complete GEOJSON data output that is filtered with the matching dates
async function displayData(){
    try {
        let low = document.getElementById('input-left').value;
        let high = document.getElementById('input-right').value;
        let city = "Seattle";
        let readData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/observations/${low}/${high}/${city}`, {method: 'GET'});
        let getVenueData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/venues/${low}/${high}`, {method: 'GET'});
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
function addLeftPanelActions(feature, marker) {
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
}

////////////////////////////////////////////////////////////////////////////////////
// MAP ON LOAD
map.on('style.load', async function() {
  // load data
  // on slider change
  let obs_data = await displayData();
  addDataLayer(obs_data);

  // filter data based upon input
  let years = document.querySelectorAll('.year-slider');
  years.forEach(item => {
    item.addEventListener('input', async function(e) {
      let left = parseInt(document.getElementById('input-left').value);
      let right = parseInt(document.getElementById('input-right').value);
      map.setFilter('data', ["all",
        [">=", ['number', ['get','year']], left],
        ["<=", ['number', ['get', 'year']], right]
      ])
    })
  });

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
    let yearLeft = document.getElementById('input-left').value;
    let yearRight = document.getElementById('input-right').value;
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
      if(localityFeatures[i].properties.year >= yearLeft && localityFeatures[i].properties.year <= yearRight) {
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
  map.on('click','data',function(e) {
    // marker.remove();
    // // clear 3-D year object
    if (typeof map.getLayer('year-block') !== "undefined" ){
      map.removeLayer('year-block');
      map.removeSource('year-block');
    };
    // map.removeLayer('year-block');
    // map.removeSource('year-block');

    // add all left panel actions (including zoom and adding data points)
    let feature = e.features[0];
    // view left panel on data click
    viewLeftPanel(e.features[0]);
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
