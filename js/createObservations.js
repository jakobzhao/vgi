export function createPackage(suffixId) {
    let packet = new URLSearchParams();
    return (suffixId == "newObservation") ? buildNewObservationPacket(packet) : buildExistingObservation(packet);
}

function buildNewObservationPacket (packet) {
    let category = document.querySelectorAll('#collapseEntry input');
    let buildCategory = buildList(category);

    let codedescriptorlist = document.querySelectorAll('#collapseAmenity input, #collapseUser input, #collapseCaution input');
    let buildCodeDescriptorList=  buildList(codedescriptorlist);

    let confidenceInt = document.getElementById('confidence-observation-api').value;
    let confidenceValues = document.querySelectorAll('#confidence-observation-values-api p');
    let confidenceValue = "";
    confidenceValues.forEach((element, index) => {
        if(index == confidenceInt) {
            confidenceValue += element.textContent;
        }
    })
    packet.append("observedvenuename", document.getElementById('location-api').value);
    packet.append("category", buildCategory.toString());
    packet.append("descriptorlist", buildCodeDescriptorList.toString());
    packet.append("address", document.getElementById('address-api').value);
    packet.append("locality", document.querySelector('#localityList li > a.dropdown-item-checked').textContent);
    packet.append("city", document.getElementById('city-api').value);
    packet.append("state", document.getElementById('state-api').value);
    packet.append("zip", document.getElementById('zip-api').value);
    packet.append("confidence", confidenceValue.replace(/\s/g,''));
    packet.append("latitude", document.getElementById('lat-api').value);
    packet.append("longitude", document.getElementById('long-api').value);
    packet.append("year", document.getElementById('current-year-value-api').value);
    packet.append("comments", document.getElementById('additionalInfo-api').value);
    packet.append("newcodelist", document.getElementById('newtags-api').value);
    return packet;
}

function buildExistingObservation(packet) {
    let category = document.querySelectorAll('#collapseEntryVerify input');
    let buildCategory = buildList(category);

    let codedescriptorlist = document.querySelectorAll('#collapseAmenityVerify input, #collapseUserVerify input, #collapseCautionVerify input');
    let buildCodeDescriptorList=  buildList(codedescriptorlist);

    let confidenceInt = document.getElementById('confidence-observation-verify-num').value;
    let confidenceValues = document.querySelectorAll('#confidence-observation-verify-values p');
    let confidenceValue = "";
    confidenceValues.forEach((element, index) => {
        if(index == confidenceInt) {
            confidenceValue += element.textContent;
        }
    })

    packet.append("vid", document.getElementById('vid-edit').textContent);
    packet.append("observedvenuename", document.getElementById('observed-name-edit').value);
    packet.append("category", buildCategory.toString());
    packet.append("codedescriptorlist", buildCodeDescriptorList.toString());
    packet.append("address", document.getElementById('address-edit').value);
    packet.append("locality", document.querySelector('#localityList li > a.dropdown-item-checked').textContent);
    packet.append("city", document.getElementById('city-edit').value);
    packet.append("state", document.getElementById('state-edit').value);
    packet.append("zip", document.getElementById('zip-edit').value);
    packet.append("confidence", confidenceValue.replace(/\s/g,''));
    packet.append("longitude", document.getElementById('long-edit').value);
    packet.append("latitude", document.getElementById('lat-edit').value)
    packet.append("year", document.getElementById('year-edit').value);
    packet.append("comments", document.getElementById('notes-edit').value);
    packet.append("newcodelist", document.getElementById('addDescriptor-edit').value);

    return packet;
}

function buildList(inputs) {
    let result = [];
    inputs.forEach(inputElement => {
        let label = document.querySelector(`label[for="${inputElement.id}"]`);
        if(inputElement.checked) {
            result.push(label.innerHTML);
        }
    })
    return result;
}