// ==UserScript==
// @name         TorontoMLS.net UI Improvements
// @namespace    http://tampermonkey.net/
// @version      0.8
// @updateURL    https://github.com/russetwolf/TorontoMLS-UI-Improvements/raw/master/TorontoMLS-UI-Improvements.user.js
// @downloadURL  https://github.com/russetwolf/TorontoMLS-UI-Improvements/raw/master/TorontoMLS-UI-Improvements.user.js
// @description  Source and Liscence: https://github.com/russetwolf/TorontoMLS-UI-Improvements
// @author       Alex Cendecki
// @match        http://v3.torontomls.net/*
// @grant        GM_addStyle
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lightgallery/1.3.2/js/lightgallery.js
// ==/UserScript==

(function(){
  //boilerplate greasemonkey to wait until jQuery is defined...
  function GM_wait()
  {
    if(typeof unsafeWindow.jQuery == 'undefined') {
      window.setTimeout(GM_wait,100);
    }
    else {
      unsafeWindow.jQuery(function() { letsJQuery(unsafeWindow.jQuery); });
    }
  }
  GM_wait();

  function letsJQuery($)
  {
      'use strict';

      //Operate on each Listing Sheet
      var listings = $('.report-container');
      $.each(listings, forEachListing);

      function forEachListing(i, sheet) {
        //skip 0 as that's the list at the top and and even "listings" as the page has wierd shadow listings
        if (i % 2 === 1) {
          sheet.classList.add("reportSheet");
          var listingObj = constructListingObject($, sheet);
          perListingUIChanges($, listingObj, sheet);
        }
      }

      overallUIChanges($);
  }

  function overallUIChanges($) {
    makeResultsClickableToListing($);
    addStickyNoteToggle($);
  }

  function makeResultsClickableToListing($) {
    var mlsNumCol = $('.data-list tbody td:last-child');
    $.each(mlsNumCol, addLink);

    function addLink(index, cell){
        var mlsNum = cell.innerText;
        cell.innerHTML = '<a href="#' + mlsNum + '">' + mlsNum + '</a>';
    }
  }

  function addStickyNoteToggle($) {
    var stickyToggle = document.createElement('div');
    stickyToggle.id = "stickyToggleDiv";
    stickyToggle.innerHTML = '<button id="stickyToggleButton" type="button">'
                + 'Toggle Sheet Summaries</button>'
                ;
    document.body.prepend(stickyToggle);
    document.getElementById ("stickyToggleButton").addEventListener (
    "click", stickyToggleButtonAction, false );
  }
  function stickyToggleButtonAction (zEvent) {
    console.log("Toggling Sticky display;")
    var notes = $(".stickyNote");
    $.each(notes, forEachNote);

    function forEachNote(i, note) {
      var report = $(note.parentNode).find(".reportSheet")[0];
      if (note.style.display != "inline-block") {
        note.style.display = "inline-block";
        report.style.display = "none";
      } else {
        note.style.display = "none";
        report.style.display = "inline-block";
      }
    }
  }

  function constructListingObject($, sheet) {
    var listingObj = {};
    listingObj.monthlyCost = 0;
    listingObj.photos = [];

    //Extract relevant info from sheet
    var listingBoxes = $(sheet).find('.form .legacyBorder div.formitem.formgroup.vertical');
    $.each(listingBoxes, parseListing);

    function parseListing(j, box) {
      // Get photos
      if(j === 1) {
        var photoJson = box.childNodes[1].childNodes[1].dataset.multiPhotos;
        var photoMap = JSON.parse(photoJson)["multi-photos"];
        $.each(photoMap, trimPhotoURLs);

        function trimPhotoURLs(p, photo) {
          listingObj.photos.push(photo.url.split("&index")[0]);
        }

        listingObj.photoBoxClone = box.childNodes[1].cloneNode(true);
      }// Extract address
      if(j === 3) {
        listingObj.address = box.innerText;
        listingObj.address = listingObj.address.replace("\n", " ");
      }// Extract price
      if(j === 5) {
        listingObj.currentPrice = box.innerText;
        listingObj.currentPrice = listingObj.currentPrice.split(" ")[0];
        listingObj.currentPrice = listingObj.currentPrice.split("$")[1];
        listingObj.currentPrice = parseFloat(listingObj.currentPrice.replace(/,/g, ''));
      }// Extract taxes
      if(box.innerText.split(":")[0] === "Taxes") {
        listingObj.taxes = box.innerText;
        listingObj.taxes = listingObj.taxes.split("/")[0];
        listingObj.taxes = listingObj.taxes.split("$")[1];
        listingObj.taxes = parseFloat(listingObj.taxes.replace(/,/g, ''));
      }// Extract type (Detatched, Condo, etc.)
      if(j === 9) {
        listingObj.type = box.children[0].innerText;
      }// Extract room numbers
      if(j === 11) {
        listingObj.baths = parseInt(box.children[2].innerText.split(":")[1]);

        var numBeds = box.children[1].innerText.split(":")[1].split(" + ");
        listingObj.mainBeds = parseInt(numBeds[0]);
        if (numBeds.length > 1) {
          listingObj.basementBeds = parseInt(numBeds[1]);
        } else {
          listingObj.basementBeds = parseInt(0);
        }
      }// Extract MLS#
      if(j === 12) {
        listingObj.id = box.innerText;
        listingObj.id = listingObj.id.split(":")[1];
      }// Process left info column
      if(j === 25) {
        $.each(box.children, selectRelevantLeftColChildren);

        function selectRelevantLeftColChildren(k, child) {
          var content = child.innerText.split(":");
          if (content[0] === "Kitchens") {
            listingObj.kitchens = 0;
            var numKitchens = content[1].split(" + ");
            for(var a = 0; a < numKitchens.length; a++) {
              listingObj.kitchens += parseInt(numKitchens[a]);
            }
          }
          if (content[0] === "Basement") {
            listingObj.basement = content[1];
          }
          if (content[0] === "Apx Age") {
            listingObj.age = content[1];
          }
          if (content[0] === "Apx Sqft") {
            listingObj.sqft = content[1];
          }
          if (content[0] === "POTL Mo Fee") {
            var fee = content[1].split("$");
            if (fee.length > 1) {
              listingObj.monthlyCost = parseFloat(fee[1].replace(/,/g, ''));
            }
          }
        }
      }// Process centre info column
      if(j === 26) {
        $.each(box.children[0].children, selectRelevantCentreColChildren);

        function selectRelevantCentreColChildren(k, child) {
          var content = child.innerText.split(":");
          if (content[0] === "Maint") {
            var fee = content[1].split("$");
            if (fee.length > 1) {
              listingObj.monthlyCost = parseFloat(fee[1].replace(/,/g, ''));
            }
          }
        }
      }
    }
    return listingObj;
  }

  function perListingUIChanges($, listingObj, sheet) {
    var stickyNote = createStickyDiv($, listingObj);
    var calculatedValues = calculateListingValues($, listingObj);

    var stickyContents = generateStickyContents(listingObj, calculatedValues);
    stickyNote.innerHTML = stickyContents;
    sheet.parentElement.prepend(stickyNote);
    // Add photoBox
    var photoContainer = $('#photoContainer_' + listingObj.id);
    addPhotoBox($, listingObj.photoBoxClone, listingObj.id, photoContainer);

    // Scrub address for Google Maps
    var mapsAddress = util_removeUnitNumberFromAddress(listingObj.address)

    // Add a Google Maps link to the links section of the listing
    insertMapsLink($, sheet, mapsAddress);
    
    // Add embeded map in sticky note
    embedMap($, stickyNote, mapsAddress, listingObj.id);

    // Add individual Toggle
    var toggle = addIndividualToggle($, sheet, listingObj.id);

  }
  function createStickyDiv($, listingObj) {
    var stickyNote = document.createElement('div');
    stickyNote.id = "stickyNote_" + listingObj.id;
    stickyNote.classList.add("stickyNote");
    // Style the summary Sticky
    GM_addStyle( 
    ' #' + stickyNote.id + ' {' +
    '    display: none;' +
    '    background: white;' +
    '    border: 0.5em solid;' +
    '    padding: 1em;' +
    '    width: 100%;' +
    '    font-size: 1rem;' +
    ' } ');
    return stickyNote;
  }

  function calculateListingValues($, listingObj) {
    var values = {};
    values.mortgagePayment = 2740+48.53*(Math.ceil(listingObj.currentPrice/1000)/10-70);
    values.maintenance = listingObj.type.includes("Condo") ? 
                            listingObj.currentPrice*0.005/12 : 
                            listingObj.currentPrice*0.01/12;
    //calculate income potential
    values.rent = 0;
      values.rentType = "none";
    if (listingObj.kitchens > 1) {
      values.rent = 1200;
      values.rentType = "basement";
      if (listingObj.basementBeds === 1) {
        values.rent = 1400;
      } else if (listingObj.basementBeds === 2) {
        values.rent = 1800;
      } else if (listingObj.basementBeds === 3) {
        values.rent = 2200;
      }
    }
    else if (listingObj.mainBeds > 2) {
      values.rent = 1000 * (listingObj.mainBeds - 2);
      values.rentType = "room";
    }

    //calculate monthly net
    values.netMonthly = values.mortgagePayment + listingObj.monthlyCost + values.maintenance - values.rent + (listingObj.taxes/12);
    return values;
  }

  function generateStickyContents(listingObj, calculatedValues) {
    var url = window.location.href.split("#")[0] + '#';
    return '<table><tr>' + 
    '<td rowspan="3"><div class="photoContainer" id="photoContainer_' + listingObj.id + '"></div></td>' + 
    '<td><b>$ ' + Math.ceil(listingObj.currentPrice/1000) + '<br>' + listingObj.type + '</b></td>' + 
    '<td>Bedrooms: ' + listingObj.mainBeds + ' + ' + listingObj.basementBeds + '</td>' + 
    '<td>MLS: ' + listingObj.id + '</td>' + 
    '</tr><tr>' + 
    '<td><i>Rent: $ ' + calculatedValues.rent + ' ' + calculatedValues.rentType + '</i></td>' + 
    '<td>Bathrooms: ' + listingObj.baths + '</td>' + 
    '<td><a class="link" href="https://www.google.com/maps/place/' + util_removeUnitNumberFromAddress(listingObj.address) + '" target="_blank">' + listingObj.address + '</a></td>' + 
    '</tr><tr>' + 
    '<td>Net: $ ' + calculatedValues.netMonthly.toFixed(0) + '</td>' +
    '<td><b>Basement: ' + listingObj.basement + '</b></td>' +  
    '<td>Sq Ft: ' + listingObj.sqft + '</td>' +  
    '</tr></table><p>' +
    '<table style="border: 1px dashed black; font-size: 8px"><tr>' + 
    '<td><a class="link" href="' + url + listingObj.id + '">' + listingObj.id + '</a></td>' + 
    '<td><a class="link" href="https://www.google.com/maps/place/' + util_removeUnitNumberFromAddress(listingObj.address) + '" target="_blank">' + listingObj.address + '</a></td>' +
    '<td>' + Math.ceil(listingObj.currentPrice/1000) + '</td>' + 
    '<td>' + calculatedValues.mortgagePayment + '</td>' +
    '<td>' + listingObj.taxes + '</td>' +
    '<td>' + (listingObj.monthlyCost + calculatedValues.maintenance) + '</td>' +
    '<td>' + calculatedValues.netMonthly + '</td>' +
    '<td>' + listingObj.type + '</td>' + 
    '<td>' + listingObj.mainBeds + '</td>' + 
    '<td>' + calculatedValues.rentType + ': ' + listingObj.basementBeds + '</td>' + 
    '<td>' + calculatedValues.rent + '</td>' + 
    '<td>' + calculatedValues.netMonthly.toFixed(0) + '</td>' +
    '</tr></table>';
  }

  function insertMapsLink($, sheet, address) {
    var ul = $(sheet).find('.links-container>ul');
    if (ul.length === 0 && ul.context.className === "report-container") {
        var linkContainer= $(sheet).find('.links-container');
        var ulli = '<ul><li><a class="tour link" href="https://www.google.com/maps/place/' + address + '" target="_blank">Google Maps</a></li></ul>';
        linkContainer.append(ulli);
    }
    if (ul.length === 1){
        var li = '<li><a class="tour link" href="https://www.google.com/maps/place/' + address + '" target="_blank">Google Maps</a></li>';
        ul.append(li);
    }
  }

  function util_removeUnitNumberFromAddress(address) {
    // separate postal code from rest of address, removing whitespace.
    var postcode = address.slice(-7).replace(/\s\s+/g, ' ');
    address = address.substring(0, address.length - 7).trimEnd();

    // split the array on spaces to get the house number at the front
    var addressArr = address.split(" ");
    // split the house number on dash to separate out the unit number at the front from the house number at the back
    var houseNumArr = addressArr[0].split("-");
    var houseNumber = "";
    if (houseNumArr.length > 1) {
      // if there is a unit number, take the second number since it's the house number; trim letters
      houseNumber = houseNumArr[1].replace(/\D/g,'');
    } else {
      // otherwise, take the first (only) number and trim letters
      houseNumber = houseNumArr[0].replace(/\D/g,'');
    }

    // remove digits, dashes, and duplicate spaces from the address
    address = address.replace(/[0-9]/g, '').replace(/-/g, '').replace(/\s\s+/g, ' ');

    // add back in the huse number and postal code
    address = houseNumber + ' ' + address + ' ' + postcode;
    return address;
  }

  function embedMap($, parentContainer, address, id) {
    var iframeHTML1 = '<iframe src="https://maps.google.com/maps?&amp;q='
    var iframeHTML2 = '&amp;output=embed" width="100%" height="450px" frameborder="0" style="border:0;" allowfullscreen="" aria-hidden="false" tabindex="0"></iframe>';
    
    var iframeCompleteHTML = iframeHTML1 + encodeURIComponent(address) + iframeHTML2;

    var gmap = document.createElement('div');
    gmap.id = "gmap_" + id;
    gmap.width = "100%";
    gmap.innerHTML = iframeCompleteHTML;

    parentContainer.append(gmap);
  }

  function addPhotoBox($, clone, id, parentContainer) {
    clone.setAttribute('id',"photoBox_" + id);
    parentContainer.append(clone);
    addGalleryToPhotoBox(id);
  }

  function addIndividualToggle($, sheet, id) {
    var toggle = document.createElement('div');
    toggle.id = "toggleDiv_" + id;
    toggle.innerHTML = '<button id="toggleButton_' + id + '" type="button">'
                + 'Toggle Sheet/Summary</button>';
    sheet.parentElement.prepend(toggle);
    document.getElementById ("toggleButton_" + id).addEventListener (
    "click", individualToggleButtonAction, false );
  }
  function individualToggleButtonAction (zEvent) {
    var id = zEvent.target.id.split("_")[1];
    console.log("Toggling " + id + " display;")
    var note = $("#stickyNote_" + id)[0];
    console.log(note);
    var report = $(note.parentNode).find(".reportSheet")[0];
    if (note.style.display != "inline-block") {
      note.style.display = "inline-block";
      report.style.display = "none";
    } else {
      note.style.display = "none";
      report.style.display = "inline-block";
    }
  }

  function addGalleryToPhotoBox(id) {
    document.getElementById ("photoBox_" + id).addEventListener (
    "click", launchGallery, false );
  }
  function launchGallery (zEvent) {
    try {
        var images = $($(this)[0].children[1]).data('multi-photos')['multi-photos'];
      }
      catch (e) {
        console.log(e);
        return;
      }
      var _elements = [];
      for (var i = 0; i < images.length; i++) {
        _elements.push({
          "src": images[i].url.split('&size')[0],
          'thumb': images[i].url,
          'subHtml': images[i].description,
          download: false
        });
      }

      $($(this)[0].children[1]).lightGallery({
        dynamic: true,
        dynamicEl: _elements,
        download: false,
        enableSwipe: true,
        zoom: true,
        scale: 1,
        actualSize: true
      });
  }
})();