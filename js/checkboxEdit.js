export function autoFill(feature) {
    populateCheckBox(feature);
}

function populateCheckBox(feature) {
    organizeReportIssueData(feature.properties.descriptorlist)
    .then(res => {
        let organizedData = res;
        checkCheckbox(organizedData);
    });
}

function checkCheckbox(organizedData) {
    let defaultCheckboxArray = Object.values(organizedData).map((values) => values);
    sessionStorage.setItem('defaultCheckbox', JSON.stringify(defaultCheckboxArray));
    // Clear all input boxes first so that checkbox does not repeat from previous clicks
    let checkedBoxes = document.querySelectorAll('div[id$="Verify"] input[type=checkbox]');
    checkedBoxes.forEach(input => {
        input.checked = false;
    })

    if(organizedData["Entry Descriptors"] != null) {
        let getEntryDescriptors = document.querySelectorAll('#collapseEntryVerify > div');
        checkReportIssueCheckbox(organizedData,"Entry Descriptors", getEntryDescriptors);
    }
    if(organizedData["Amenities/Services"] != null) {
        let getAmenityDescriptors = document.querySelectorAll('#collapseAmenityVerify > div');
        checkReportIssueCheckbox(organizedData,"Amenities/Services", getAmenityDescriptors);
    }
    if(organizedData["Clientele/User Descriptors"] != null) {
        let getUserDescriptors = document.querySelectorAll('#collapseUserVerify > div');
        checkReportIssueCheckbox(organizedData,"Clientele/User Descriptors", getUserDescriptors);
    }
    if(organizedData["Caution/Restriction"] != null) {
        let getCautionDescriptors = document.querySelectorAll('#collapseCautionVerify > div');
        checkReportIssueCheckbox(organizedData,"Caution/Restriction", getCautionDescriptors);
    }
}

// Helper function that automatically checks for matching string values
function checkReportIssueCheckbox(data, key, elements) {
    elements.forEach(parent => {
      let input = parent.querySelector('input');
      let label = parent.querySelector('label');
      if(data[key].includes(label.textContent)) {
        input.checked = true;
      }
    })
}

// organize report issue data given descriptor list on code lookup
function organizeReportIssueData(descriptorList) {
    let filteredData = new Object();
    return fetch('assets/CodeLookup.json')
      .then((response) => response.json())
      .then((data) => {
        let length = Object.keys(data).length;
        for(let i = 0; i < length; i ++) {
          if(descriptorList.includes(data[i]["Descriptor"])) {
            // if filtereddata contains key already
            let descr = data[i]["Descriptor"];
            let metaDescr = data[i]["Meta Descriptor"];
            if(!filteredData.hasOwnProperty(metaDescr)) {
              filteredData[metaDescr] = [];
            }
            filteredData[metaDescr].push(descr);
          }
        }
        return filteredData;
      })
}