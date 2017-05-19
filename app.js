window.onload = initialize

function initialize() {
    var
        recentMap,
        recentMapCenter,
        recentMapBounds,
        entryMap,
        entryMapCenter,
        circleOptions,
        circle,
        sightingsRef,
        usersRef,
        recentMapMarkers = [],
        recentMapMarkersLookup = [],
        entryMapMarker,
        currentUser,
        signinReferer

    var navItems = [
        'homeLink',
        'entryLink',
        'aboutLink',
        'contactLink',
        'signinLink',
        'signoutLink',
        'accountLink',
        'signupLink',
    ]

    infoWindow = new google.maps.InfoWindow({ maxWidth: 250 })

    initializeFirebase()
    getLocation();

    function onlyMakeActive(linkname) {
        for (var i = 0, l = navItems.length; i < l; i++) {
            if (linkname !== navItems[i]) {
                $('#' + navItems[i]).removeClass('active')
            } else {
                $('#' + navItems[i]).addClass('active')
            }
        }
    }

    function show(element) {
        $('#' + element).show()
    }

    function hide(element) {
        $('#' + element).hide()
    }

    render(decodeURI(window.location.hash), true);

    $(window).on('hashchange', function () {
        render(decodeURI(window.location.hash));
    });
    $('#submitEntryButton').click(writeEntry);

    $("#entryLinkA").click(function (event) {
        signinReferer = '#entry'
    });
    $("#signinLinkA").click(function (event) {
        signinReferer = '#signin'
    });
    $('#verifyRefreshButton').click(function () {
        location.reload();
    })

    function initializeFirebase() {
        var config = {
            apiKey: "AIzaSyBvJFoXLKicAYR3h-M7hXjl9fElMKBnPUM",
            authDomain: "fdfs.com",
            databaseURL: "https://orcaspot-2be4d.firebaseio.com",
            storageBucket: "orcaspot-9c0ab.appspot.com",
        };
        firebaseApp = firebase.initializeApp(config);
        sightingsRef = firebase.database().ref('Sightings');
        usersRef = firebase.database().ref('Users');

        firebase.auth().onAuthStateChanged(function (user) {
            currentUser = user
            if (user) {
                $('#signupLinkA').attr('href', '#entry')
                $('#entryLinkA').attr('href', '#entry')
                $('#entryPaneNotVerified').hide()
                //$('#entryPane').show()
                show('entryPane')
                hide('signinLink')
                //$("#signinLink").hide();
                //$("#accountLink").show();
                show('accountLink')
                $("#signupLink").hide();
                $('#signoutLink').show();
                if (!user.emailVerified) {
                    $('#entryPane').hide()
                    $('#entryPaneNotVerified').show()
                }
            } else {
                $("#accountLink").hide()
                $('#btnSigninUser').show()
                $('#entryLinkA').attr('href', '#signin')
                $('#entryPane').hide()
                $('#entryPaneNotVerified').hide()
                $("#signinLink").show()
                $('#signupLink').show()
                $('#signoutLink').hide();
            }
        });
    }

    function render(url, isInit) {
        var temp = url.split('/')[0];
        $('.main-content .page').hide();
        var map = {
            '': function () {
                renderHistoryPage(isInit);
            },
            '#': function () {
                renderHistoryPage(isInit);
            },
            '#entry': function () {
                renderEntryPage(isInit);
            },
            '#about': function () {
                renderAboutPage(isInit);
            },
            '#contact': function () {
                renderContactPage(isInit);
            },
            '#account': function () {
                renderAccountPage(isInit);
            },
            '#signin': function () {
                renderSigninPage(isInit);
            },
            '#resetpw': function () {
                renderPasswordResetPage(isInit);
            },
            '#signup': function () {
                renderSignupPage(isInit);
            },
            '#signout': function () {
                renderSignOutPage(isInit);
            }
        };
        if (map[temp]) {
            map[temp]();
        }
        else {
            renderErrorPage();
        }
    }

    function renderHistoryPage(isInit) {
        onlyMakeActive('homeLink')
        $('#signupLink').removeClass('active')
        $('.history').show();
        if (!isInit) {
            google.maps.event.trigger($("#divRecentMap")[0], 'resize');
            recentMap.fitBounds(circle.getBounds())
            recentMap.setCenter(recentMapCenter)
        }
    }

    function renderEntryPage(isInit) {
        onlyMakeActive('entryLink')
        $('#submitEntryButton').show();
        $('#submitEntryButtonThankYou').hide();
        $('.entry').show();
        if (!isInit) {
            google.maps.event.trigger($("#divEntryMap")[0], 'resize');
            entryMap.setCenter(entryMapCenter)
        }
    }

    function renderErrorPage(isInit) {
        $('.error').show();
    }

    function renderAboutPage(isInit) {
        onlyMakeActive('aboutLink')
        $('.about').show();
    }

    function renderContactPage(isInit) {
        onlyMakeActive('contactLink')
        $('.contact').show();
    }

    function renderSigninPage(isInit) {
        onlyMakeActive('signinLink')
        $('#btnsigninUser').show()
        $('.signin').show();
        $('#signinError').hide()
        $('#signinErrorMessage').empty()
        $('#signinSuccess').hide()
    }

    function renderSignupPage(isInit) {
        onlyMakeActive('signupLink')

        $('#btnCreateUser').show()
        $('.signup').show();
        $('#signupError').hide()
        $('#signupErrorMessage').empty()
        $('#signupSuccess').hide()
    }

    function renderAccountPage(isInit) {
        $('#homeLink').removeClass('active')
        $('#entryLink').removeClass('active')
        $('#aboutLink').removeClass('active')
        $('#contactLink').removeClass('active')
        $('#signinLink').removeClass('active')
        $('#signupLink').removeClass('active')
        $('#accountLink').addClass('active')
        $('.account').show();
    }

    function renderPasswordResetPage(isInit) {
        onlyMakeActive('pwResetLink')
        $('.pwreset').show();
        $('#txtResetEmail').val('')
        $("txtResetEmail").prop('disabled', false);
    }

    function renderSignOutPage(isInit) {
        firebase.auth().signOut();
        window.location.href = "/";
    }

    function getLocation() {
        if (!navigator.geolocation) {
            alert('Geolocation failed. Application is probably broken. Please contact the administrator.')
        }
        else {
            navigator.geolocation.getCurrentPosition(
                function showLocation(position) {
                    displayRecentMap(position.coords.latitude, position.coords.longitude)
                    displayEntryMap(position.coords.latitude, position.coords.longitude)
                },
                function showError(err) {
                    var errorMessage = err.message
                    switch (err.code) {
                        case 1:
                            errorMessage = errorMessage + " Please be sure you have enabled location services, and have allowed this application access, then refresh this page."
                            break;
                        case 2:
                            errorMessage = errorMessage + ". Please contact the administrator."
                            break;
                    }
                    $('#entryErrorMessage').html(errorMessage)
                    $('#historyErrorMessage').html(errorMessage)
                    $('#loadingHistory').hide()
                    $('#loadingEntry').hide()
                    $('#historyError').show()
                    $('#entryError').show()
                },
                { timeout: 60000 }
            )
        }
    }

    function displayRecentMap(lat, lon) {
        var recentMapOptions = {
            center: { lat: lat, lng: lon },
            zoom: 8,
            draggable: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            streetViewControl: false,
            zoomControl: true,
        };
        recentMap = new google.maps.Map(document.getElementById("divRecentMap"), recentMapOptions);

        recentMapCenter = { lat: lat, lng: lon }
        var radius = 5
        circleOptions = {
            center: { lat: lat, lng: lon },
            strokeColor: "#000000",
            strokeOpacity: 0.8,
            strokeWeight: 0,
            fillOpacity: 0,
            map: recentMap,
            radius: radius * 1609
        }
        circle = new google.maps.Circle(circleOptions);
        recentMap.fitBounds(circle.getBounds())
        document.getElementById("loadingHistory").style.display = 'none';
        recentMap.addListener('idle', function () {
            recentMapBounds = recentMap.getBounds()
            listHistory(recentMap);
        });
    }

    function listHistory(map) {
        var daysToLimit = 10
        sightingsRef.orderByChild("datetimeunix").startAt(moment().unix() - (daysToLimit * 86400)).endAt(moment().unix()).once("value", function (snapshot) {
            $('#sightings').empty()
            snapshot.forEach(function (childsnapshot) {
                makeIt(childsnapshot, 0)
            })
        })
    }

    (function listHistoryUpdate(map) {
        sightingsRef.orderByChild("datetimeunix").startAt(moment().unix()).on("child_added", function (snapshot) {
            makeIt(snapshot, 1500, true)
        })

    } ());

    function doesMarkerExist(lookupArray, index) {
        for (var i = 0, l = lookupArray.length; i < l; i++) {
            if (lookupArray[i][0] === index) {
                return true;
            }
        }
        return false;
    }

    function makeIt(snapshot, fadeRate, isUpdate) {
        var lat = snapshot.child("locationLat").val()
        var lon = snapshot.child("locationLon").val()
        if (recentMapBounds.contains({ lat: lat, lng: lon })) {
            if (!doesMarkerExist(recentMapMarkersLookup, snapshot.key)) {
                // Create Marker & InfoWindow
                var contentString = '<div style="text-align: left; padding:5px;"><b>' + moment(moment.unix(snapshot.child("datetimeunix").val()).format()).fromNow() + ' </b>near<b> ' + snapshot.child("locationGeocode").val() + '</b><br><br>' + snapshot.child("comments").val() + '</div>'
                var diff = moment().diff(moment.unix(snapshot.child("datetimeunix").val()), 'hours')
                var markerUrl
                var markerSize
                var markerZindex
                switch (true) {
                    case (diff <= 5):
                        icon = {
                            url: '/img/spotpin-green.svg',
                            scaledSize: new google.maps.Size(48, 48),
                        }
                        markerZindex = google.maps.Marker.MAX_ZINDEX - 2
                        break;

                    case (diff <= 24):
                        icon = {
                            url: '/img/spotpin-blue.svg',
                            scaledSize: new google.maps.Size(40, 40),
                        }
                        markerZindex = google.maps.Marker.MAX_ZINDEX - 1
                        break;

                    case (diff > 24):
                        icon = {
                            url: '/img/spotpin-gray.svg',
                            scaledSize: new google.maps.Size(32, 32),
                        }
                        markerZindex = google.maps.Marker.MAX_ZINDEX
                        break;
                }
                var marker = new google.maps.Marker({
                    position: { lat: lat, lng: lon },
                    title: '(' + lat + ', ' + lon + ')',
                    map: recentMap,
                    id: snapshot.key,
                    clickable: true,
                    icon: icon,
                    zIndex: markerZindex,
                    optimized: false
                });
                recentMapMarkers.push(marker)
                recentMapMarkersLookup.push([snapshot.key])
                google.maps.event.addListener(marker, "click", function (e) {
                    infoWindow.setContent(contentString)
                    infoWindow.open(recentMap, marker)
                    $('#' + marker.get("id")).effect("highlight", { color: "#B9D5ED" }, 1500)
                })
            }
            // Update HTML in the DOM
            $('#sightings').prepend(generateEntryHtml(snapshot.val(), snapshot.key, diff))
            if (isUpdate) {
                $('#' + snapshot.key + '').animateNewEntry("#D5E1EB", 900);
            } else {
                $('#' + snapshot.key + '').show()
            }
        } else {
            removeMarker(recentMapMarkers, recentMapMarkersLookup, snapshot.key)
        }
    }

    $.fn.animateNewEntry = function (color, rate) {
        this.each(function () {
            $(this).css("background-color", color)
            $(this).fadeIn(rate)
            $(this).animate({
                backgroundColor: "#FFF"
            }, rate);
        })
    }

    function generateEntryHtml(record, key, diff) {
        var bgColor = "#FFF"
        var html = '';
        html += '<li id="' + key + '" class="list-group-item" style="margin-bottom: 0px; border:0px; display:none; background-color: ' + bgColor + ';">';
        html += '<div id="highlight' + key + '" style="padding:2px; padding-bottom:6px;">'
        html += '<div style="display:flex;">';
        html += '<div style="width:20px; margin-right:10px;">'
        html += '<i class="fa fa-dot-circle-o" aria-hidden="true" style="color: #1E4E82; font-size: 20px;"></i>';
        html += '</div>';
        html += '<div style="text-align:left">';
        /*html += '<span><b>' + moment(record.datetime).fromNow() + '</b></span>';*/
        html += '<span><b>' + moment(moment.unix(record.datetimeunix).format()).fromNow() + '</b></span>';
        if (record.locationGeocode == 'undefined') {
            html += '<span> in <b>international waters</b></span>';
        } else {
            html += '<span> near <b>' + record.locationGeocode + '</b></span>';
        }
        html += '</div>';
        html += '</div>'
        if (record.comments) {
            html += '<div style="margin-left:30px; margin-top: 2px; display: flex;">'
            html += '<div class="bubble" style="white-space: pre-wrap; text-align: left;">' + record.comments + '</div>'
            html += '</div>'
        }
        html += '</div>'
        html += '</li>'
        return html;
    }

    (function removeEntryHtml() {
        sightingsRef.on("child_removed", function (snapshot) {
            $('#' + snapshot.key + '').fadeOut(1500);
            removeMarker(recentMapMarkers, recentMapMarkersLookup, snapshot.key)
        })
    } ());

    function removeMarker(markersArray, lookupArray, index) {
        for (var i = 0; i < markersArray.length; i++) {
            if (lookupArray[i][0] === index) {
                markersArray[i].setMap(null)
                markersArray.splice(i, 1)
                lookupArray.splice(i, 1)
            }
        }
    }

    function displayEntryMap(lat, lon) {
        var entryMapOptions = {
            center: { lat: lat, lng: lon },
            zoom: 13,
            draggable: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            streetViewControl: false,
            zoomControl: true
        };
        entryMap = new google.maps.Map(document.getElementById("divEntryMap"), entryMapOptions);
        entryMapCenter = { lat: lat, lng: lon }
        entryMapMarker = new google.maps.Marker({
            position: { lat: lat, lng: lon },
            map: entryMap,
            title: "Place me where the sighting was.",
            draggable: true
        });
        google.maps.event.addListener(entryMap, 'center_changed', function () {
            window.setTimeout(function () {
                newCenter = entryMap.getCenter()
                entryMapMarker.setPosition(newCenter);
                entryMapCenter = { lat: newCenter.lat(), lng: newCenter.lng() }
            }, 0);
        })
        document.getElementById("loadingEntry").style.display = 'none';
        document.getElementById("entryPane").style.display = 'block';
    }

    $('.navbar-collapse a').click(function () {
        $(".navbar-collapse").collapse('hide');
    });

    function geoParse(arr) {
        var route = ''
        var neighborhood = ''
        var locality = ''
        var admin2 = ''
        var admin1 = ''
        var country = ''
        var geoString = ''
        for (var i = 0, len = arr.length; i < len; i++) {
            switch (arr[i].types[0]) {
                /*case 'route':
                    if (arr[i].long_name !== 'Unnamed Road') {
                        route = arr[i].long_name
                        geoString += route
                        geoString += ', '
                        break;
                    } 
                    else { break }*/
                case 'neighborhood':
                    neighborhood = arr[i].long_name
                    geoString += neighborhood
                    geoString += ', '
                    break;
                case 'locality':
                    locality = arr[i].long_name
                    geoString += locality
                    geoString += ', '
                    break;
                case 'administrative_area_level_2':
                    admin2 = arr[i].long_name
                    geoString += admin2
                    geoString += ', '
                    break;
                case 'administrative_area_level_1':
                    admin1 = arr[i].long_name
                    geoString += admin1
                    geoString += ', '
                    break;
                case 'country':
                    country = arr[i].long_name
                    geoString += country
                    break;
            }
        }
        return geoString
    }

    function writeEntry() {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'location': entryMapMarker.getPosition() }, function (results, error) {
            if (results.length > 0) {
                locationGeocode = geoParse(results[0].address_components)
            } else {
                locationGeocode = "undefined"
            }
            var datetime = moment().format()
            var data = {
                comments: document.getElementById('txtComments').value,
                datetimeunix: moment(datetime).unix(),
                locationLat: entryMapCenter.lat,
                locationLon: entryMapCenter.lng,
                locationGeocode: locationGeocode,
                userid: currentUser.uid
            }
            sightingsRef.push(data)
            document.getElementById('txtComments').value = ""
            $('#submitEntryButton').hide()
            $('#submitEntryButtonThankYou').fadeIn()
            window.setTimeout(function () {
                window.location.href = "/#";
            }, 3000);
        });
    }

    $('#pwResetButton').click(function () {
        $('#pwResetWorking').show()
        $('#pwResetButton').hide()
        var email = $('#txtResetEmail').val()
        firebaseApp.auth().sendPasswordResetEmail(email).then(function () {
            $('#pwResetWorking').hide()
            $('#pwResetSuccess').show()
            $("txtResetEmail").prop('disabled', true);
        }, function (error) {
            $('#pwResetSuccess').hide()
            $('#pwResetError').html(error.code + ' - ' + error.message)
            $('#pwResetError').show()
        });
    })

    function translateError(operation, error) {
        var output = error.message
        switch (operation) {
            case "signinUser":
                switch (error.code) {
                    case "auth/invalid-email":
                        output = "Incorrect password"
                        break;
                    case "auth/wrong-password":
                        output = "Incorrect password"
                        break;
                    case "auth/weak-password":
                        output = error.message
                        break;
                    case "auth/email-already-in-use":
                        output = error.message
                        break;
                }
                break;
            case "createUser":
                switch (error.code) {
                    case "auth/invalid-email":
                        output = "Please enter a valid email address."
                        break;
                    case "auth/weak-password":
                        output = error.message
                        break;
                    case "auth/email-already-in-use":
                        output = error.message
                        break;
                    case "auth/app-not-authorized":
                        output = "Application is probably broken - Please contact the administrator."
                        break;
                }
                break
        }
        return output;
    }

    $('#btnCreateUser').click(function () {
        $('#signupError').hide()
        $('#signupWorking').show()
        var email = $('#txtCreateEmail').val()
        var password = $('#txtCreatePassword').val()
        var username = $('#txtCreateUsername').val()
        firebaseApp.auth().createUserWithEmailAndPassword(email, password)
            .then(function (user) {
                // Writes extra metadata about the user to the Users child in the database
                /*usersRef.child(user.uid).set({
                    username: username
                })*/
                $('#btnCreateUser').hide()
                $('#signupWorking').hide()
                user.sendEmailVerification()
                $('#signupSuccess').fadeIn(800)
                $('#txtCreateEmail').val('')
                $('#txtCreatePassword').val('')
            })
            .catch(function (error) {

                $('#signupWorking').hide()
                $('#signupErrorMessage').html(translateError("createUser", error))
                $('#signupError').show()
            })
    })

    $('#btnSigninUser').click(function () {
        $('#signinError').hide()
        $('#signinWorking').show()
        var email = $('#txtSigninEmail').val()
        var password = $('#txtSigninPassword').val()
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(function (user) {
                $('#btnSigninUser').hide()
                $('#signinWorking').hide()
                $('#signinSuccess').fadeIn(800)
                $('#txtSigninEmail').val('')
                $('#txtSigninPassword').val('')
                if (signinReferer == '#entry') { window.location.href = "#entry"; } else { window.location.href = '/#'; }
            })
            .catch(function (error) {
                $('#signinWorking').hide()
                $('#signinErrorMessage').html(translateError("signinUser", error))
                $('#signinError').show()
            });
    })
} 