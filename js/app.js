var map, geocoder, bounds, infowindow;
var addresses = [];
var markers= [];
var infowindows = [];
var placenames=[];
var $wikiElem = $('#wikipedia-links');
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
	center: {lat: -33.8688, lng: 151.2093},
	zoom: 15
	});
	bounds = new google.maps.LatLngBounds();
	document.getElementById('show-listings').addEventListener('click', showListings);
	document.getElementById('hide-listings').addEventListener('click', hideListings);
	document.getElementById('delete-listings').addEventListener('click', deleteListings);
	codeAddress();
	}

function codeAddress() {
	deleteListings();
	try {
		if(infowindow){infowindow.close();}
	} catch(err){
		console.log(err);
	}
	geocoder = new google.maps.Geocoder();
	var address = document.getElementById('address').value;
	var poiTypes = document.getElementsByName('type');
	for(var i=0; i<poiTypes.length; i++){
		if(poiTypes[i].checked){
			poiType = poiTypes[i].value;
		}
	}
	addresses.push(address);
	geocoder.geocode( { 'address': address}, function(results, status) {
		if (status == 'OK') {
			
			map.setCenter(results[0].geometry.location);
			var service = new google.maps.places.PlacesService(map);
			service.nearbySearch({
				location: results[0].geometry.location,
				radius: document.getElementById("radius_input").value,
				type: [poiType]
			}, callback);
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
	});
}

function callback(results, status) {
	placenames=[];
	document.getElementById("item-list").innerHTML = '';
	if (status === google.maps.places.PlacesServiceStatus.OK) {
		for (var i = 0; i < results.length; i++) {
			createMarker(results[i]);
			if(results[i].name){console.log(results[i].name)};
			placenames.push(results[i].name);
		}
		document.getElementById("item-list").appendChild(makeUL(placenames));
	}
}
function createMarker(place) {
	var placeLoc = place.geometry.location;
	var marker = new google.maps.Marker({
		title: place.name,
		map: map,
		position: place.geometry.location
	});
	markers.push(marker);
	var infowindow = new google.maps.InfoWindow({content: place.name});
	infowindows.push(infowindow);
	marker.addListener('click', function(){
	populateInfoWindow(marker, infowindow);
	});	
}

function populateInfoWindow(marker, infowindow) {
	initMap();
	map.center = marker.position;
	// In case the status is OK, which means the pano was found, compute the
	// position of the streetview image, then calculate the heading, then get a
	// panorama from that and set the options
	function getStreetView(data, status) {
		if (status == google.maps.StreetViewStatus.OK) {
			var nearStreetViewLocation = data.location.latLng;
			var heading = google.maps.geometry.spherical.computeHeading(
				nearStreetViewLocation, marker.position);
			console.log("heading "+ heading);
			infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
			var panoramaOptions = {
				position: nearStreetViewLocation,
				pov: {
					heading: heading,
					pitch: 30
				}
			};
			var panorama = new google.maps.StreetViewPanorama(
				document.getElementById('pano'), panoramaOptions);
		} else {
			infowindow.setContent('<div>' + marker.title + '</div>' +
				'<div>No Street View Found</div>');
		}
	}
	for(var i=0; i<infowindows.length; i++){
		infowindows[i].close();
	}
	if(infowindow){infowindow.close();}
	// Check to make sure the infowindow is not already opened on this marker.
	if (infowindow.marker != marker) {
	// Clear the infowindow content to give the streetview time to load.
	infowindow.setContent('');
	infowindow.marker = marker;
	// Make sure the marker property is cleared if the infowindow is closed.
	infowindow.addListener('closeclick', function() {
		infowindow.marker = null;
	});
	var streetViewService = new google.maps.StreetViewService();
	var radius = 50;
	
	// Use streetview service to get the closest streetview image within
	// 50 meters of the markers position
	streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
	// Open the infowindow on the correct marker.
	
	infowindow.open(map, marker);
	}
}

function showListings(){
	for (var i=0; i<markers.length; i++){
		markers[i].setMap(map);
	}
}

function hideListings(){
	for (var i=0; i<markers.length; i++){
		markers[i].setMap(null);
	}
}

function deleteListings(){
	hideListings();
	markers=[];
}

function makeUL(array) {
    // Create the list element:
    var list = document.createElement('ul');
    list.id = "list";
    for(var i = 0; i < array.length; i++) {
        // Create the list item:
        var item = document.createElement('li');

        // Set its contents:
        item.appendChild(document.createTextNode(array[i]));
        var googleLink = document.createElement('a');
        googleLink.href = "http://www.google.com/search?q="+array[i].replace(" ", "+")+address.value.replace("", "+");
        googleLink.target = "_blank"
        googleLink.appendChild(item);

        // var wikiLink = document.createElement('a');
        // wikiLink.href = "http://en.wikipedia.org/wiki/"+ array[i].replace(" ", "_")+address.value.replace("", "_");
        // wikiLink.value = "Wikipedia Link";
        // Add it to the list:
        //console.log(""+getWikiJSON(array[i].replace(" ", "_")+address.value.replace("", "_")));
        list.appendChild(googleLink);
        // list.appendChild(wikiLink);
    }

    // Finally, return the constructed list:
    return list;
}

function getWikiJSON(searchString){
	//Wiki Ajax request
    var wikiURL = 'http://en.wikipedia.org/w/api.php?action=opensearch&search='+searchString+'&format=json&callback=wikiCallback';
    var wikiRequestTimeout = setTimeout(function(){
        $wikiElem.text("failed to get wikipedia resources");
    }, 8000);
    $.ajax({
        url: wikiURL,
        dataType: "jsonp",
        //jsonp: "callback"
        success: function(response){
            var articleList = response[1];
            return articleList[0];
        }
    });
}