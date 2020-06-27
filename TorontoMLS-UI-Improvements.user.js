// ==UserScript==
// @name         TorontoMLS.net UI Improvements
// @namespace    http://tampermonkey.net/
// @version      0.6
// @updateURL    https://github.com/russetwolf/TorontoMLS-UI-Improvements/raw/master/TorontoMLS-UI-Improvements.user.js
// @downloadURL  https://github.com/russetwolf/TorontoMLS-UI-Improvements/raw/master/TorontoMLS-UI-Improvements.user.js
// @description  Source and Liscence: https://github.com/russetwolf/TorontoMLS-UI-Improvements
// @author       Alex Cendecki
// @match        http://v3.torontomls.net/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
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

      overallUIChanges($);

      //Operate on each Listing Sheet
      var listings = $('.report-container');
      $.each(listings, forEachListing);

      function forEachListing(i, sheet) {

          var listingObj = constructListingObject($, sheet);

          perListingUIChanges($, listingObj, sheet);
      }
  }

  function overallUIChanges($) {
    makeResultsClickableToListing($);
  }

  function makeResultsClickableToListing($) {
    var mlsNumCol = $('.data-list tbody td:last-child');
    $.each(mlsNumCol, addLink);

    function addLink(index, cell){
        var mlsNum = cell.innerText;
        cell.innerHTML = '<a href="#' + mlsNum + '">' + mlsNum + '</a>';
    }
  }

  function constructListingObject($, sheet) {
    var listingObj = {};
    //Extract relevant info from sheet
    var listingBoxes = $(sheet).find('.form .legacyBorder div.formitem.formgroup.vertical');
    $.each(listingBoxes, parseListing);

    function parseListing(j, box) {
      if(j === 1) {
        // Placeholder select for photo boxes later
        //box.css('background','#ccffff')
        //console.log(box);
      }
      if(j === 3) {
        // Extract address
        listingObj.address = box.innerText;
        listingObj.address = listingObj.address.replace("\n", " ");
      }
      if(j === 5) {
        // Extract price
        listingObj.currentPrice = box.innerText;
        listingObj.currentPrice = listingObj.currentPrice.split(" ")[0];
        listingObj.currentPrice = listingObj.currentPrice.split("$")[1];
        listingObj.currentPrice = parseFloat(listingObj.currentPrice.replace(/,/g, ''));
      }
      if(j === 9) {
        // Extract type (Detatched, Condo, etc.)
        listingObj.type = box.children[0].innerText;
      }
      if(j === 11) {
        // Extract room numbers
        listingObj.beds = box.children[1].innerText.split(":")[1];
        listingObj.baths = box.children[2].innerText.split(":")[1];
      }
      if(j === 12) {
        // Extract MLS#
        listingObj.id = box.innerText;
        listingObj.id = listingObj.id.split(":")[1];
      }
      if(j === 25) {
        // Process left info column
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
        }
      }
    }
    return listingObj;
  }

  function perListingUIChanges($, listingObj, sheet) {
    if(listingObj.address) {
      insertMapsLink($, sheet, util_removeUnitNumberFromAddress(listingObj.address));
    }

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
})();