// ==UserScript==
// @name            Amazon - Show Seller Info
// @name:de         Amazon - Verkäuferinformationen anzeigen
// @name:fr         Amazon - Afficher les informations sur le vendeur
// @name:es         Amazon - Mostrar información del vendedor
// @name:it         Amazon - Mostra info venditore
// @description     Shows name, country of origin and ratings for third party sellers on Amazon (and highlights Chinese sellers)
// @description:de  Zeigt Name, Herkunftsland und Bewertungen von Drittanbietern auf Amazon (und hebt chinesische Anbieter hervor)
// @description:fr  Montre le nom, le pays d'origine et les évaluations des vendeurs tiers sur Amazon (et met en évidence les vendeurs chinois)
// @description:es  Muestra el nombre, el país de origen y las valoraciones de los vendedores de terceros en el Amazon (y destaca los vendedores chinos)
// @description:it  Mostra il nome, il paese di origine e le valutazioni per i venditori di terze parti su Amazon (e mette in evidenza i venditori cinesi)
// @namespace       https://github.com/tadwohlrapp
// @author          Tad Wohlrapp
// @version         1.1.4
// @license         MIT
// @homepageURL     https://github.com/tadwohlrapp/amazon-show-seller-info-userscript
// @supportURL      https://github.com/tadwohlrapp/amazon-show-seller-info-userscript/issues
// @updateURL       https://github.com/tadwohlrapp/amazon-show-seller-info-userscript/raw/main/amazon-show-seller-info.meta.js
// @downloadURL     https://github.com/tadwohlrapp/amazon-show-seller-info-userscript/raw/main/amazon-show-seller-info.user.js
// @icon            https://github.com/tadwohlrapp/amazon-show-seller-info-userscript/raw/main/icon.png
// @icon64          https://github.com/tadwohlrapp/amazon-show-seller-info-userscript/raw/main/icon64.png
// @match           https://smile.amazon.co.uk/*
// @match           https://www.amazon.co.uk/*
// @match           https://smile.amazon.de/*
// @match           https://www.amazon.de/*
// @match           https://www.amazon.es/*
// @match           https://www.amazon.fr/*
// @match           https://www.amazon.it/*
// @compatible      firefox Tested on Firefox v90 with Violentmonkey v2.13.0, Tampermonkey v4.13 and Greasemonkey v4.11
// @compatible      chrome Tested on Chrome v94  with Violentmonkey v2.13.0 and Tampermonkey v4.13
// ==/UserScript==

(function () {
  'use strict';
 
  const highlightedCountries = ['CN', 'HK'];
  // Country codes as per ISO 3166-1 alpha-2
  // Set to [] to highlight no sellers at all
  // Set to ['FR'] to highlight sellers from France
  // Default: ['CN', 'HK']
 
  // Check URLs for page type (search result page and best sellers page)
  const isSearchResultPage = window.location.href.match(/.*\.amazon\..*\/s\?.*/);
  const isBestsellersPage = window.location.href.match(/.*\.amazon\..*\/gp\/bestsellers\/.*/) || window.location.href.match(/.*\.amazon\..*\/Best\-Sellers\-.*/);
 
  if (isSearchResultPage || isBestsellersPage) {
    function showSellerCountry() {
 
      const products = isSearchResultPage ?
        document.querySelectorAll('h2.a-size-mini.a-spacing-none.a-color-base a.a-link-normal.a-text-normal:not([data-seller])') :
        document.querySelectorAll('span.aok-inline-block.zg-item>a.a-link-normal:not([data-seller])');
 
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        product.setAttribute('data-seller', 'set');
 
        if (product.href && product.href.match(/.*\.amazon\..*\/(.*\/dp|gp\/slredirect)\/.*/)) {
 
          fetch(product.href).then(function (response) {
            if (response.ok) {
              return response.text();
            }
          }).then(function (html) {
            const productPage = parse(html);
            const thirdPartySellerSelectors = [
              '#desktop_qualifiedBuyBox :not(#usedAccordionRow) #sellerProfileTriggerId',
              '#desktop_qualifiedBuyBox :not(#usedAccordionRow) #merchant-info a:first-of-type',
              '#newAccordionRow #sellerProfileTriggerId',
              '#newAccordionRow #merchant-info a:first-of-type'
            ]
            const thirdPartySeller = productPage.querySelector(String(thirdPartySellerSelectors));
            const isThirdPartySeller = thirdPartySeller !== null;
 
            if (isThirdPartySeller) {
              thirdPartySeller.textContent = thirdPartySeller.textContent.trim();
              thirdPartySeller.href = thirdPartySeller.href.replace(/sp\?.*/g, 'sp?' + thirdPartySeller.href.match(/(seller=[^&]*)/)[1]);
              const sellerInfoLink = document.createElement('a');
              sellerInfoLink.href = thirdPartySeller.href;
              const sellerInfoContent = document.createTextNode(thirdPartySeller.textContent);
              sellerInfoLink.appendChild(sellerInfoContent);
              sellerInfoLink.classList.add('seller-info');
 
              isSearchResultPage ?
                product.parentNode.parentNode.appendChild(sellerInfoLink) :
                product.parentNode.insertBefore(sellerInfoLink, product.parentNode.querySelector('.a-icon-row.a-spacing-none'));
 
 
              fetch(thirdPartySeller.href).then(function (response) {
                if (response.ok) {
                  return response.text();
                } else if (response.status === 503) {
                  throw new Error('Too many requests 🙄 Amazon blocked seller page');
                } else {
                  throw new Error(response.status);
                }
              }).then(function (html) {
                const sellerPage = parse(html);

                // Detect Amazon's 2022-04-20 redesign
                const sellerProfileContainer = sellerPage.getElementById('seller-profile-container');
                const isRedesign = sellerProfileContainer.classList.contains('spp-redesigned');

                // Get seller rating
                let rating = sellerPage.getElementById(isRedesign ? 'seller-feedback-summary-rd' : 'seller-feedback-summary');
 
                let ratingPercentage = '';
                let ratingCount = '';
                if (sellerPage.getElementById('feedback-no-rating')) {
                  ratingPercentage = sellerPage.getElementById('feedback-no-rating').textContent;
                } else {
                  ratingPercentage = sellerPage.getElementsByClassName('feedback-detail-description')[0].textContent.match(/\d+%/);
                }
                if (rating.contains(sellerPage.getElementById('feedback-no-review'))) {
                  ratingCount = sellerPage.getElementById('feedback-no-review').textContent;
                } else {
                  ratingCount = sellerPage.getElementsByClassName('feedback-detail-description')[0].textContent.match(/\(([^)]+)\)/)[1];
                }
                const sellerInfoRatingText = ' (' + ratingPercentage + ' | ' + ratingCount + ')';
                const sellerInfoRating = document.createTextNode(sellerInfoRatingText);
                sellerInfoLink.appendChild(sellerInfoRating);
 
                let sellerCountry = '';
                if (isRedesign) {
                  sellerCountry = sellerPage.querySelector('#page-section-detail-seller-info .a-box-inner .a-row:last-of-type span').textContent.toUpperCase();
                } else {
                // Get seller country & flag
                const sellerUl = sellerPage.querySelectorAll('ul.a-unordered-list.a-nostyle.a-vertical'); //get all ul
                const sellerUlLast = sellerUl[sellerUl.length - 1]; //get last list
                const sellerLi = sellerUlLast.querySelectorAll('li'); //get all li
                const sellerLiLast = sellerLi[sellerLi.length - 1]; //get last li
                sellerCountry = sellerLiLast.textContent.toUpperCase();
                }

                if (sellerCountry.length == 2) {
                  const flag = document.createElement('span');
                  flag.textContent = getFlagEmoji(sellerCountry);
                  flag.title = sellerCountry;
                  flag.classList.add('seller-flag');
                  sellerInfoLink.prepend(flag);
 
                  // Highlight sellers from countries defined in 'highlightedCountries'
                  if (highlightedCountries.includes(sellerCountry)) {
                    const outercontainer = isSearchResultPage ?
                      product.closest('.a-carousel-card, .s-result-item') :
                      product.closest('.zg-item-immersion');
 
                    const productImage = isSearchResultPage ?
                      outercontainer.querySelector('.s-image') :
                      outercontainer.querySelector('.zg-text-center-align img');
 
                    outercontainer.style.background = 'linear-gradient(180deg, rgba(222,41,14,0.33) 0%, rgba(222,41,14,0) 100%)';
                    productImage.style.opacity = '0.66';
                  }
                } else {
                  console.info('Wait, that\'s illegal! 🚨 Seller "' + thirdPartySeller.textContent + '" (' + thirdPartySeller.href + ') has no valid imprint!');
                }
              }).catch(function (err) {
                console.warn('Could not fetch seller data for "' + thirdPartySeller.textContent + '" (' + thirdPartySeller.href + '): ', err);
              });
 
            } else {
              const sellerInfoDiv = document.createElement('div');
              let soldbyAmazon = '';
              if (productPage.querySelector('#tabular-buybox .tabular-buybox-text')) {
                soldbyAmazon = productPage.querySelector('#tabular-buybox .tabular-buybox-container > .tabular-buybox-text:nth-of-type(4)').textContent.trim();
              } else if (!productPage.querySelector('#merchant-info')) {
                soldbyAmazon = '?';
              } else {
                soldbyAmazon = productPage.querySelector('#merchant-info').textContent.trim();
              }
              if (!soldbyAmazon.replace(/\s/g, '').length) {
                soldbyAmazon = '? ? ?';
              } else {
                const svg = document.createElement('span');
                svg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="12" height="12" style="vertical-align: bottom;margin-right: 4px;"><path fill="#f90" d="M110.2 103.3c-51.8 24.7-84 4-104.6-8.5-1.2-.8-3.4.2-1.5 2.4 6.8 8.3 29.3 28.3 58.6 28.3 29.4 0 46.9-16 49-18.8 2.2-2.7.7-4.3-1.5-3.4zm14.5-8c-1.3-1.8-8.4-2.1-12.9-1.6-4.4.5-11.1 3.3-10.5 4.9.3.6.9.3 4 0 3-.3 11.6-1.3 13.4 1 1.8 2.4-2.7 13.6-3.6 15.4-.8 1.8.3 2.3 1.8 1 1.5-1.1 4.2-4.3 6-8.7 1.8-4.4 2.9-10.6 1.8-12zm0 0"></path><path fill-rule="evenodd" d="M75.4 53c0 6.5.1 11.9-3.2 17.6-2.6 4.7-6.8 7.6-11.4 7.6-6.4 0-10.1-4.9-10.1-12 0-14.2 12.6-16.8 24.7-16.8zM92 93.5c-1.1 1-2.7 1-4 .4-5.4-4.6-6.4-6.7-9.5-11-9 9.2-15.5 12-27.3 12-14 0-24.9-8.6-24.9-25.9 0-13.5 7.3-22.6 17.7-27.1 9-4 21.6-4.7 31.3-5.8V34c0-4 .3-8.7-2-12-2-3.1-6-4.4-9.4-4.4-6.3 0-12 3.3-13.3 10-.3 1.5-1.4 3-3 3l-16-1.7c-1.4-.3-2.9-1.4-2.5-3.5C32.9 6 50.5 0 66.3 0c8.1 0 18.7 2.1 25 8.3 8.1 7.5 7.4 17.6 7.4 28.5v26c0 7.7 3.2 11.1 6.2 15.3 1.1 1.5 1.3 3.3 0 4.4L92 93.5"></path></svg>';
                sellerInfoDiv.appendChild(svg);
              }
              const sellerInfoContent = document.createTextNode(soldbyAmazon);
              sellerInfoDiv.appendChild(sellerInfoContent);
              sellerInfoDiv.classList.add('seller-info');
 
              isSearchResultPage ?
                product.parentNode.parentNode.appendChild(sellerInfoDiv) :
                product.parentNode.insertBefore(sellerInfoDiv, product.parentNode.querySelector('.a-icon-row.a-spacing-none'));
            }
 
          }).catch(function (err) {
            // There was an error
            console.warn('Something went wrong fetching ' + product.href, err);
          });
        }
      }
    }
 
    // Run script once on document ready
    showSellerCountry();
 
    // Initialize new MutationObserver
    const mutationObserver = new MutationObserver(showSellerCountry);
 
    // Let MutationObserver target the grid containing all thumbnails
    const targetNode = document.body;
 
    const mutationObserverOptions = {
      childList: true,
      subtree: true
    }
 
    // Run MutationObserver
    mutationObserver.observe(targetNode, mutationObserverOptions);
 
    function parse(html) {
      const parser = new DOMParser();
      return parser.parseFromString(html, 'text/html');
    }
 
    // Country Code to Flag Emoji (Source: https://dev.to/jorik/country-code-to-flag-emoji-a21)
    function getFlagEmoji(countryCode) {
      const codePoints = countryCode
        .split('')
        .map(char =>  127397 + char.charCodeAt());
      return String.fromCodePoint(...codePoints);
    }

    function addGlobalStyle(css) {
      const head = document.getElementsByTagName('head')[0];
      if (!head) { return; }
      const style = document.createElement('style');
      style.innerHTML = css;
      head.appendChild(style);
    }
 
    // Add Google's own CSS used for image dimensions
    addGlobalStyle(`
    .seller-info {
        display: inline-block;
        background: #fff;
        color: #1d1d1d !important;
        font-size: 11px;
        line-height: 15px;
        padding: 2px 5px;
        font-weight: 400;
        border: 1px solid #E0E0E0;
        margin-top: 4px;
        height: 22px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
    }
    a.seller-info:hover {
        border-color: #D0D0D0;
        text-decoration: none;
        background-color: #F3F3F3;
    }
    span.seller-flag {
        font-size: 23px;
        line-height: 15px;
        vertical-align: text-top;
        margin-right: 5px;
    }
    #zg-center-div .zg-item-immersion {
        height: 390px;
    }
    `);
  }
})();