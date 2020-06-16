// ==UserScript==
// @name         TorontoMLS.net UI Improvements
// @namespace    http://tampermonkey.net/
// @version      0.3
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

      //Make top table clickable
      var mlsNumCol = $('.data-list tbody td:last-child');
      $.each(mlsNumCol, addLink);

      function addLink(index, cell){
          var mlsNum = cell.innerText;
          cell.innerHTML = '<a href="#' + mlsNum + '">' + mlsNum + '</a>';
      }

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

          //Insert Maps link
          var ul = $(this).find('.links-container>ul');
          if (ul.length === 0 && ul.context.className === "report-container") {
              var linkContainer= $(this).find('.links-container');
              var ulli = '<ul><li><a class="tour link" href="https://www.google.com/maps/place/' + address + '" target="_blank">Google Maps</a></li></ul>';
              linkContainer.append(ulli);
          }
          if (ul.length === 1){
              var li = '<li><a class="tour link" href="https://www.google.com/maps/place/' + address + '" target="_blank">Google Maps</a></li>';
              ul.append(li);
          }
      }


  }
})();