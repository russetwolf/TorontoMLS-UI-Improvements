// ==UserScript==
// @name         TorontoMLS.net UI Improvements
// @namespace    http://tampermonkey.net/
// @version      0.5
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
    if(typeof unsafeWindow.jQuery == 'undefined')
      window.setTimeout(GM_wait,100);
    else
      unsafeWindow.jQuery(function() { letsJQuery(unsafeWindow.jQuery); });
  }
  GM_wait();

  function letsJQuery($)
  {
      'use strict';

      makeTopLinkClickable($);

      //Operate on each Info Sheet
      var infoSheets = $('.report-container');
      $.each(infoSheets, forEachInfoSheet);

      function forEachInfoSheet(i, sheet) {
          //Extract relevant info from sheet
          var infoSheetBoxes = $(this).find('.form .legacyBorder div.formitem.formgroup.vertical');
          var address = "";
          $.each(infoSheetBoxes, selectRelevantBoxes);

          function selectRelevantBoxes(j, box) {
            if(j === 3) {
              // Extract address
              address = box.innerText;
              address = address.replace("\n", " ");
            }
            if(j === 1) {
              // Placeholder select for photo boxes later
              //$(this).css('background','#ccffff')
              //console.log(box);
            }
          }
          if(address != "") {
            insertMapsLink($, i, sheet, removeUnitNumberFromAddress(address));
          }
      }
  }

  function makeTopLinkClickable($) {
    var mlsNumCol = $('.data-list tbody td:last-child');
    $.each(mlsNumCol, addLink);

    function addLink(index, cell){
        var mlsNum = cell.innerText;
        cell.innerHTML = '<a href="#' + mlsNum + '">' + mlsNum + '</a>';
    }
  }

  function insertMapsLink($, i, sheet, address) {
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

  function removeUnitNumberFromAddress(address) {
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