import geocoder
import pandas as pd
import os
import time
from datetime import date


# If use mapbox, then an access token is required - obtained through creating an account in Mapbox.
access_token = "pk.eyJ1Ijoia2Vyd2luamlhbyIsImEiOiJja3FneGp0bWkxZ3J0MnBudnZkMjh2M25qIn0.r6o6XuIlR4k6ISWp2KGI3Q"

# Add data files - have change depend on csv and excel locations
directory = "/Users/Kerwin/Desktop/LGBTQ+ Space/Geocoding code/testingData/"
location = "Seattle, WA"

# Find all files in the set directory above
files = os.listdir(directory)
print(files)
df = []
# Read into directory and put all files into list
for i in range(len(files)):
    if not files[i].startswith("."):
        print(files[i])
        temp_df = pd.read_csv(directory + files[i])
        temp_df.columns = temp_df.columns.str.lower()
        df.append(temp_df)
        print(i)
print(df)
# # NULL values in address currently changed to name
# for i in range(len(df)):
#     for j in range(len(df[i].address)):
#         # make each address field into a valid string
#         if "NULL" in df[i].address[j]:
#             df[i].address[j] = str(df[i].name[j])
#         elif "NaN" in df[i].address[j]:
#             df[i].address[j] = str(df[i].name[j])

# Geocoding for lat and lng
# Code is also timed to make comparisons
t0 = time.time()
for i in range(len(df)):
    lat = []
    long = []
    confidence = []
    codedAddress = []
    POIType = []
    Geocoder = []
    dateAdded = []

    for j in range(len(df[i].address)):
        g = geocoder.mapbox(str(df[i].address[j]) + " " + location, key=access_token)
        output = g.json
        # if mapbox code throws error 404, then currently replace with Seattle lat long
        if "404" in g.status:
            lat.append(47.6038)
            long.append(-122.3301)
            # Print out i,j // i = file, j = row observation
            print(i, j)
        else:
            # Otherwise this is data obtained from the geocoder API
            print(output)
            lat.append(g.latlng[0])
            long.append(g.latlng[1])
            confidence.append(output['raw']['relevance'])
            codedAddress.append(output['raw']['place_name'])
            # POIType.append(output['raw']['properties']['category'])
            Geocoder.append('Mapbox')
            dateAdded.append(date.today())

    df[i]["Latitude"] = lat
    df[i]["Longitude"] = long
    df[i]["Confidence"] = confidence
    df[i]["CodedAddress"] = codedAddress
    # df[i]["POIType"] = POIType
    df[i]["Geocoder"] = Geocoder
    df[i]["DateAdded"] = dateAdded
t1 = time.time()
print(t1-t0)


# output file with {name of file}_geocoded.csv
for i in range(len(files)):
    if not files[i].startswith("."):
        print(files[i])
        df[i].to_csv(directory + files[i][:-4] + "_geocoded.csv", index=True)
