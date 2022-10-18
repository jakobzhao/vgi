export function populateInputFields(feature) {
    inputElements(feature);
}

function inputElements(feature) {
    // Populate form input fields with feature values
    document.getElementById('vid-edit').textContent = feature.properties.vid;
    document.getElementById('observed-name-edit').value = feature.properties.observedvenuename;
    document.getElementById('address-edit').value = feature.properties.address;
    document.getElementById('city-edit').value = feature.properties.city;
    document.getElementById('state-edit').value = feature.properties.state;
    document.getElementById('year-edit').value = feature.properties.year;
    document.getElementById('zip-edit').value = feature.properties.zip;
    document.getElementById('long-edit').value = feature.geometry.coordinates[0];
    document.getElementById('lat-edit').value = feature.geometry.coordinates[1];

    if(feature.properties.placenotes != "null") {
    document.getElementById('notes-edit').value = feature.properties.placenotes;
    }
}

