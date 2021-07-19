mapboxgl.accessToken = 'pk.eyJ1Ijoia2V2aW5rb2NodW55dSIsImEiOiJja3BkdDRkMzYxaHJiMnBvMWNlZ21iZm12In0.EgOe8AAJuApJrrEDtc62IQ';
var map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/streets-v11', // style URL
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

// confidence slider (right dashboard)-testing with d3.js
var sliderStep = d3
  .sliderBottom()
  .min(0)
  .max(1)
  .width(200)
  .ticks(10)
  .step(0.1)
  .default(0.5)
  .on('onchange', val=> {
    // add map filter on change of just confidence intervals
    // d3.select('p#confidence-text').text(d3.format('.00')(val));
  });

  var gStep = d3
    .select('div#confidence-slider')
    .append('svg')
    .attr('width', 400)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

  gStep.call(sliderStep);

// displayData
// Obtain the data from the database given the input values from the year slider
// returns a complete GEOJSON data output that is filtered with the matching dates
async function displayData(){
    try {
        let low = document.getElementById('input-left').value;
        let high = document.getElementById('input-right').value;
        let readData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/observations/${low}/${high}`, {method: 'GET'});
        let getVenueData = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/venues/${low}/${high}`, {method: 'GET'});
        let venueData = await getVenueData.json();
        let data = await readData.json();
        data.push(...venueData);
        return toGEOJSON(data);
    } catch(error) {
        console.log(error);
    }
}

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
}

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
}

// Add observation data layer onto map
function addDataLayer(obsData) {
    map.addLayer({
      'id': 'data',
      'type': 'circle',
      'source': {
        type: 'geojson',
        data: obsData
      },
      'paint': {
        'circle-radius': 5,
        'circle-stroke-width': 2,
        'circle-color': 'red',
        'circle-stroke-color': 'white'
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
}

// assign switch layer function for all radio button inputs
for (var i = 0; i < inputs.length; i++) {
  inputs[i].onclick = switchLayer;
}

////////////////////////////////////////////////////////////////////////////////////
// MAP ON LOAD
map.on('style.load', async function() {
  // load data
  // on slider change
  let obs_data = await displayData();
  addDataLayer(obs_data);
  console.log(obs_data);

  // slider setting with matching years
  // TODO: can be reduced using functions
  document.getElementById('input-left').addEventListener('input', function(e){
    let left = parseInt(e.target.value);
    map.setFilter('data', ['>=', ['number', ['get','year']], left]);

    document.getElementById('input-right').addEventListener('input', function(e) {
      let right = parseInt(e.target.value);
      map.setFilter('data', ['<=', ['number', ['get', 'year']], right]);
    })
  });

  document.getElementById('input-right').addEventListener('input', function(e){
    let right = parseInt(e.target.value);
    map.setFilter('data', ['<=', ['number', ['get','year']], right]);

    document.getElementById('input-left').addEventListener('input', function(e) {
      let left = parseInt(e.target.value);
      map.setFilter('data', ['>=', ['number', ['get', 'year']], left]);
    })
  });

  // create temporary marker if user wants to validate a location
  var marker = new mapboxgl.Marker({
    draggable:true
  });

  // Marker change when clicked on data point
  map.on('click','data',function(e) {
    let features = e.features[0];
    if (typeof map.getLayer('selectedMarker') !== "undefined" ){
      map.removeLayer('selectedMarker');
      map.removeSource('selectedMarker');
    }

    map.addSource('selectedMarker', {
      "type": 'geojson',
      'data': features
    })

    map.addLayer({
      'id':'selectedMarker',
      'type': 'circle',
      'source': 'selectedMarker',
      'paint': {
        'circle-radius' : 10,
        'circle-color' : 'pink'
      }
    });
  });


  // trigger review/location information on click of location point of map
  map.on('click','data',function(e) {
    // parse the codes to increase readability
    let codeString = "";
    let codes = e.features[0].properties.codeList;
    for(let i=0; i < codes.length; i++) {
      if(codes[i] !== '[' && codes [i] !== '"' && codes[i] !== '.' && codes[i] !== ']' && codes[i] !== "'") {
        codeString += codes[i];
      }
    };

    // fly and zoom to point when clicked
    map.flyTo({
      center: e.features[0].geometry.coordinates,
      zoom: 14,
      speed: 0.5,
      essential: true
    });

    // Left Canvas Informaiton
    let dataCanvas = document.getElementById('info');
    dataCanvas.classList.remove('slide-out');
    dataCanvas.classList.add('slide-in');
    dataCanvas.classList.remove('hidden');
    document.getElementById('name').innerHTML = e.features[0].properties.name;
    document.getElementById('year-info').innerHTML = e.features[0].properties.year;
    document.getElementById('address').innerHTML = e.features[0].properties.address;
    document.getElementById('state').innerHTML = e.features[0].properties.state;
    document.getElementById('city').innerHTML = e.features[0].properties.city;
    document.getElementById('code').innerHTML = codeString;
    document.getElementById('type').innerHTML = e.features[0].properties.type;
    document.getElementById('long').innerHTML = e.features[0].geometry.coordinates[0];
    document.getElementById('lat').innerHTML = e.features[0].geometry.coordinates[1];

    // Edit observation pre-filled values
    document.getElementById('observed-name-edit').value = e.features[0].properties.name;
    document.getElementById('address-edit').value = e.features[0].properties.address;
    document.getElementById('city-edit').value = e.features[0].properties.city;
    document.getElementById('state-edit').value = e.features[0].properties.state;
    document.getElementById('year-edit').value = e.features[0].properties.year;
    document.getElementById('zip-edit').value = e.features[0].properties.zip;
    document.getElementById('long-edit').value = e.features[0].geometry.coordinates[0];
    document.getElementById('lat-edit').value = e.features[0].geometry.coordinates[1];
    document.getElementById('type-edit').value = e.features[0].properties.type;
    document.getElementById('notes-edit').value = e.features[0].properties.notes;
    document.getElementById('codelist-edit').value = codeString;
    document.getElementById('confidence-edit').value = e.features[0].properties.confidence;

    // if validate observation is clicked, display movable marker
    let validateObservation = document.getElementById('validate-observation-btn');
    validateObservation.addEventListener('click', function() {
      marker.setLngLat([ e.lngLat.lng, e.lngLat.lat ]).addTo(map);
      function onDragEnd() {
        var lngLat = marker.getLngLat();
        document.getElementById('long-edit').value = lngLat.lng;
        document.getElementById('lat-edit').value = lngLat.lat;
      }
      marker.on('dragend', onDragEnd);
      });

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
