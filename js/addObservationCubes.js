export function createCubes(data) {
    let layer = cubeLayer(data);
    map.addLayer(layer);
    let lineLayer = cubeLine(data);
    map.addLayer(lineLayer);

    // change pointer when mouse enters cube
    map.on('mouseenter', 'year-block', function() {
      map.getCanvas().style.cursor = 'pointer';
    })

    map.on('mouseleave', 'year-block', function() {
      map.getCanvas().style.cursor = '';
    })

}

function cubeLayer(data) {
    let sourceData = processDataForCubes(data, false);
    let layer = {
        'id': 'year-block',
        'type': 'fill-extrusion',
        'source': {
          'type': 'geojson',
          'data': sourceData,
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
    };
    return layer;
}

function cubeLine(data) {
  let sourceData = processDataForCubes(data, true);
  let layer = {
    'id': 'year-block-line',
    'type': 'fill-extrusion',
    'source': {
      'type': 'geojson',
      'data': sourceData,
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
  };
  return layer;
}

function processDataForCubes(data, isLine) {
  // Condense data if same longitude and latitude
    let condensedData = new Object();
    data.forEach( (observation, index) => {
        // if they are the same coordinates, then we add together
        // coordinate as key
        let coordinates = observation.geometry.coordinates.toString();
        if(!condensedData.hasOwnProperty(coordinates) || condensedData[coordinates].name != observation.properties.observedvenuename) {
            condensedData[coordinates] = {"years": [],
                                          "name": observation.properties.observedvenuename,
                                          "address": [],
                                          "datasource": [],
                                          "dateadded": [],
                                          "descriptorlist": []
                                        }
        }
        condensedData[coordinates].years.push(observation.properties.year);
        condensedData[coordinates].address.push(observation.properties.address);
        condensedData[coordinates].datasource.push(observation.properties.source);
        condensedData[coordinates].dateadded.push(new Date(observation.properties.dateadded).toLocaleDateString());
        if(observation.properties.codedescriptorlist != null) {
          condensedData[coordinates].descriptorlist.push(observation.properties.codedescriptorlist.join(","));
        }
    })

    // Sort observation years in numerical ascending order
    for (let element in condensedData) {
        condensedData[element].years.sort(function(a,b) {return a-b});
    }

    let cubesData = {
        'type': 'FeatureCollection',
        'features': createFeatures(condensedData, isLine)
    };
    return cubesData;
}

function createFeatures(condensedData,  isLine) {
  let result = [];
  let polygonRadius = isLine ? 0.001 : 0.01;
  let options = {
    steps: 100,
    units: 'kilometers'
  };

  let scaleTest = chroma.scale('OrRd').colors(12);

  Object.keys(condensedData).forEach( key => {
    let keyFloat = key.split(",").map(Number);
    for(let element in keyFloat) {
      parseFloat(element);
    }
    let feature = {
      'type':'Feature',
      'properties': {'name': condensedData[key].name,
                    'years': condensedData[key].years,
                    'address': condensedData[key].address,
                    'descriptorlist': condensedData[key].descriptorlist,
                    'datasource': condensedData[key].datasource,
                    'dateadded': condensedData[key].dateadded,
                    'height': 60,
                    'base': isLine ? 0 : 50,
                    'paint': scaleTest[0]},
      'geometry': {
        'type': 'Polygon',
        'coordinates': turf.circle(keyFloat, polygonRadius, options).geometry.coordinates
      }
    }
    result.push(feature);
  })
  return result;
}