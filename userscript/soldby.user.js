// ==UserScript==
// @name            SoldBy - Reveal Sellers on Amazon
// @name:de         SoldBy - Verkäufer auf Amazon anzeigen
// @name:fr         SoldBy - Révéler les vendeurs sur Amazon
// @name:es         SoldBy - Revelar vendedores en Amazon
// @name:it         SoldBy - Rivela i venditori su Amazon
// @description     Shows name, country of origin and ratings for third party sellers on Amazon (and highlights Chinese sellers)
// @description:de  Zeigt Name, Herkunftsland und Bewertungen von Drittanbietern auf Amazon an (und hebt chinesische Anbieter hervor)
// @description:fr  Montre le nom, le pays d'origine et les évaluations des vendeurs tiers sur Amazon (et met en évidence les vendeurs chinois)
// @description:es  Muestra el nombre, el país de origen y las valoraciones de los vendedores de terceros en el Amazon (y destaca los vendedores chinos)
// @description:it  Mostra il nome, il paese di origine e le valutazioni per i venditori di terze parti su Amazon (e mette in evidenza i venditori cinesi)
// @namespace       https://github.com/tadwohlrapp
// @author          Tad Wohlrapp
// @version         1.4.0
// @license         MIT
// @homepageURL     https://github.com/tadwohlrapp/soldby
// @supportURL      https://github.com/tadwohlrapp/soldby/issues
// @updateURL       https://greasyfork.org/scripts/402064/code/script.meta.js
// @downloadURL     https://greasyfork.org/scripts/402064/code/script.user.js
// @icon            https://github.com/tadwohlrapp/soldby/raw/main/userscript/img/icon.png
// @match           https://www.amazon.co.jp/*
// @match           https://smile.amazon.co.uk/*
// @match           https://www.amazon.co.uk/*
// @match           https://smile.amazon.com/*
// @match           https://www.amazon.com/*
// @match           https://www.amazon.com.mx/*
// @match           https://www.amazon.com.tr/*
// @match           https://smile.amazon.de/*
// @match           https://www.amazon.de/*
// @match           https://www.amazon.es/*
// @match           https://www.amazon.fr/*
// @match           https://www.amazon.it/*
// @match           https://www.amazon.nl/*
// @match           https://www.amazon.se/*
// @compatible      firefox Tested on Firefox v101 with Violentmonkey v2.13.0, Tampermonkey v4.17.6161 and Greasemonkey v4.11
// @compatible      chrome Tested on Chrome v102 with Violentmonkey v2.13.0 and Tampermonkey v4.16.1
// ==/UserScript==

(function () {
  'use strict';

  const options = {
    highlightedCountries: ['?', 'CN', 'HK']
  };
  // Country codes as per ISO 3166-1 alpha-2
  // Set to [] to highlight no sellers at all
  // Set to ['FR'] to highlight sellers from France
  // Default: ['CN', 'HK']

  function showSellerCountry() {

    // Gets the ASIN for every visible product and sets it as "data-asin" attribute
    getAsin();

    // Identify products by looking for "data-asin" attribute
    const productsWithAsinSelectors = [
      'div[data-asin]',
      'not([data-asin=""])',
      'not([data-seller-name])',
      'not([data-uuid*=s-searchgrid-carousel])',
      'not([role="img"])',
      'not(#averageCustomerReviews)',
      'not(#detailBullets_averageCustomerReviews)',
      'not(.inline-twister-swatch)',
      'not(.contributorNameID)',
      'not(.a-hidden)',
      'not(.rpi-learn-more-card-content)',
      'not(#reviews-image-gallery-container)',
      'not([class*=_cross-border-widget_style_preload-widget])',
      'not([data-video-url])'
    ];
    const products = document.querySelectorAll(productsWithAsinSelectors.join(':'));

    // If no new products are found, return.
    if (products.length == 0) return;

    products.forEach((product) => {

      // Give each product the data-seller-name attribute to prevent re-capturing.
      product.dataset.sellerName = 'loading...';

      createInfoBox(product);

      if (localStorage.getItem(asinKey(product))) {
        getSellerFromLocalStorage(product);
      } else {
        getSellerFromProductPage(product);
      }
    });
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

  function getAsin() {

    // Check current page for products (without "data-asin" attribute)
    const productSelectors = [
      '.a-carousel-card > div:not([data-asin])',
      '.octopus-pc-item:not([data-asin])',
      'li[class*=ProductGridItem__]:not([data-asin])',
      'div[class*=_octopus-search-result-card_style_apbSearchResultItem]:not([data-asin])',
      '.sbv-product:not([data-asin])',
      '.a-cardui #gridItemRoot:not([data-asin])'
    ];
    const products = document.querySelectorAll(String(productSelectors));

    // If no new products are found, return.
    if (products.length == 0) return;

    products.forEach((product) => {

      // Take the first link but not if it's inside the "Bestseller" container (links to bestsellers page instead of product page) and not if it has the popover-trigger class, as its href is just "javascript:void(0)" (hidden feedback form on sponsored products)
      const link = product.querySelector('a:not(.s-grid-status-badge-container > a):not(.a-popover-trigger)');

      // If link cannot be found, return
      if (!link) return;

      link.href = decodeURIComponent(link.href);
      let asin = '';
      const searchParams = new URLSearchParams(link.href);
      if (searchParams.get('pd_rd_i')) {
        asin = searchParams.get('pd_rd_i')
      } else if (/\/dp\/(.*?)($|\?|\/)/.test(link.href)) {
        asin = link.href.match(/\/dp\/(.*?)($|\?|\/)/)[1]
      }
      product.dataset.asin = asin;
    });
  }

  function getSellerFromLocalStorage(product) {
    const { sid: sellerId, sn: sellerName } = JSON.parse(localStorage.getItem(asinKey(product)));
    if (sellerId) product.dataset.sellerId = sellerId;
    product.dataset.sellerName = sellerName;
    // console.log('Got ASIN from Local Storage', asinKey(product))
    setSellerDetails(product);
  }

  function getSellerFromProductPage(product) {
    // fetch seller, get data, save in local storage, set attributes

    if (!product.dataset.asin) return;

    const link = window.location.origin + '/dp/' + product.dataset.asin + '?psc=1';

    fetch(link).then(function (response) {
      if (response.ok) {
        return response.text();
      }
    }).then(function (html) {
      const productPage = parse(html);

      let sellerId, sellerName;

      // weed out various special product pages:
      const specialPageSelectors = [
        '#gc-detail-page', /* gift card sold by amazon */
        '.reload_gc_balance', /* reload amazon balance */
        '#dp.digitaltextfeeds, #dp.magazine, #dp.ebooks, #dp.audible', /* magazines, subscriptions, audible, etc */
        '.av-page-desktop, .avu-retail-page' /* prime video */
      ];

      if (productPage.querySelector(String(specialPageSelectors))) {
        sellerName = 'Amazon';
      } else {
        // find third party seller mention on product page
        const thirdPartySellerSelectors = [
          '#desktop_qualifiedBuyBox :not(#usedAccordionRow) #sellerProfileTriggerId',
          '#desktop_qualifiedBuyBox :not(#usedAccordionRow) #merchant-info a:first-of-type',
          '#newAccordionRow #sellerProfileTriggerId',
          '#newAccordionRow #merchant-info a:first-of-type'
        ]

        const thirdPartySeller = productPage.querySelector(String(thirdPartySellerSelectors));

        if (thirdPartySeller) {

          // Get seller ID
          const searchParams = new URLSearchParams(thirdPartySeller.href);
          sellerId = searchParams.get('seller');
          const sellerUrl = window.location.origin + '/sp?seller=' + sellerId;

          // Get seller Name
          sellerName = thirdPartySeller.textContent.trim();
        } else {

          let queryMerchantName = ' ';
          if (productPage.querySelector('#tabular-buybox .tabular-buybox-text')) {
            queryMerchantName = productPage.querySelector('#tabular-buybox .tabular-buybox-container > .tabular-buybox-text:last-of-type').textContent.trim();
          } else if (productPage.querySelector('#merchant-info')) {
            queryMerchantName = productPage.querySelector('#merchant-info').textContent.trim();
          }

          if (queryMerchantName.replace(/\s/g, '').length) {
            sellerName = 'Amazon';
          } else {
            sellerName = '? ? ?';
          }
        }
      }

      // Set data-seller-name attribute
      product.dataset.sellerName = sellerName;

      if (sellerId) {
        // If seller is known: set ASIN with corresponding seller in local storage
        localStorage.setItem(asinKey(product), `{"sid":"${sellerId}","sn":"${sellerName}","ts":"${Date.now()}"}`);
        // Set data-seller-id attribute
        product.dataset.sellerId = sellerId;
      }

      if (sellerName == 'Amazon') {
        localStorage.setItem(asinKey(product), `{"sn":"${sellerName}","ts":"${Date.now()}"}`);
      }

      setSellerDetails(product);

    }).catch(function (err) {
      console.warn('Something went wrong fetching ' + link, err);
    });
  }

  function setSellerDetails(product) {
    if (product.dataset.sellerName.includes('Amazon') || product.dataset.sellerName == '? ? ?') {
      populateInfoBox(product);
      return; // if seller is Amazon or unknown, no further steps are needed
    }

    if (localStorage.getItem(sellerKey(product))) {
      // seller-id found in local storage
      const { c: country, rs: ratingScore, rc: ratingCount } = JSON.parse(localStorage.getItem(sellerKey(product)));
      product.dataset.sellerCountry = country;
      product.dataset.sellerRatingScore = ratingScore;
      product.dataset.sellerRatingCount = ratingCount;

      // console.log('Got Seller from Local Storage', sellerKey(product))

      highlightProduct(product);
      populateInfoBox(product);

    } else {
      // seller-id not found in local storage. fetch seller details from seller-page

      // build seller link
      const link = window.location.origin + '/sp?seller=' + product.dataset.sellerId;

      fetch(link).then(function (response) {
        if (response.ok) {
          return response.text();
        } else if (response.status === 503) {
          product.dataset.blocked = true;
          populateInfoBox(product);
          throw new Error('🙄 Too many requests. Amazon blocked seller page. Please try again in a few minutes.');
        } else {
          throw new Error(response.status);
        }
      }).then(function (html) {

        let seller = getSellerDetailsFromSellerPage(parse(html));
        // --> seller.country      (e.g. 'US')
        // --> seller.rating.score (e.g. '69%')
        // --> seller.rating.count (e.g. '420')

        // Set attributes: data-seller-country, data-seller-rating-score and data-seller-rating-count
        product.dataset.sellerCountry = seller.country;
        product.dataset.sellerRatingScore = seller.rating.score;
        product.dataset.sellerRatingCount = seller.rating.count;

        // Write to local storage
        localStorage.setItem(sellerKey(product), `{"c":"${seller.country}","rs":"${seller.rating.score}","rc":"${seller.rating.count}","ts":"${Date.now()}"}`);

        highlightProduct(product);
        populateInfoBox(product);

      }).catch(function (err) {
        console.warn('Could not fetch seller data for "' + product.dataset.sellerName + '" (' + link + '):', err);
      });
    }
  }

  function getSellerDetailsFromSellerPage(sellerPage) {
    // Detect Amazon's 2022-04-20 redesign
    const sellerProfileContainer = sellerPage.getElementById('seller-profile-container');
    const isRedesign = sellerProfileContainer.classList.contains('spp-redesigned');

    const country = getSellerCountryFromSellerPage(sellerPage, isRedesign); // returns DE
    const rating = getSellerRatingFromSellerPage(sellerPage, isRedesign); // returns 91%

    return { country, rating };
  }

  function getSellerCountryFromSellerPage(sellerPage, isRedesign) {
    let country;
    if (isRedesign) {
      country = sellerPage.querySelector('#page-section-detail-seller-info .a-box-inner .a-row:last-of-type span')?.textContent.toUpperCase();
    } else {
      try {
        const sellerUl = sellerPage.querySelectorAll('ul.a-unordered-list.a-nostyle.a-vertical'); //get all ul
        const sellerUlLast = sellerUl[sellerUl.length - 1]; //get last list
        const sellerLi = sellerUlLast.querySelectorAll('li'); //get all li
        const sellerLiLast = sellerLi[sellerLi.length - 1]; //get last li
        country = sellerLiLast.textContent.toUpperCase();
      } catch {
        return '?';
      }
    }
    return (/^[A-Z]{2}$/.test(country)) ? country : '?';
  }

  function getSellerRatingFromSellerPage(sellerPage, isRedesign) {
    let idSuffix = isRedesign ? '-rd' : '';
    if (sellerPage.getElementById('sellerName' + idSuffix).textContent.includes('Amazon')) {
      return false; // seller is Amazon subsidiary and doesn't display ratings
    }

    let text = sellerPage.getElementById('seller-feedback-summary' + idSuffix).textContent;
    let regex = /(\d+%).*?\((\d+)/;
    let zeroPercent = '0%';

    // Turkish places the percentage sign in front (e.g. %89)
    if (document.documentElement.lang === 'tr-tr') {
      regex = /(%\d+).*?\((\d+)/;
      zeroPercent = '%0';
    }

    let rating = text.match(regex);
    let score = rating ? rating[1] : zeroPercent;
    let count = rating ? rating[2] : '0';

    return { score, count };
  }

  function highlightProduct(product) {
    if (options.highlightedCountries.includes(product.dataset.sellerCountry)) {
      // Highlight sellers from countries defined in 'options.highlightedCountries'
      product.classList.add('product--highlight');
    }
  }

  function createInfoBox(product) {
    const infoBoxCt = document.createElement('div');
    infoBoxCt.classList.add('seller-info-ct');

    if (product.offsetWidth < 400) {
      infoBoxCt.classList.add('a-size-small');
    }

    const infoBox = document.createElement('div');
    infoBox.classList.add('seller-info');

    const icon = document.createElement('div');
    icon.classList.add('seller-icon', 'seller-loading');
    infoBox.appendChild(icon);

    const text = document.createElement('div');
    text.classList.add('seller-text');
    text.textContent = product.dataset.sellerName;
    infoBox.appendChild(text);

    infoBoxCt.appendChild(infoBox);

    let productTitle = findTitle(product);

    if (productTitle) {
      productTitle.parentNode.insertBefore(infoBoxCt, productTitle.nextSibling);
    } else {
      product.appendChild(infoBoxCt);
    }

    fixHeights(product);
  }

  function populateInfoBox(product) {
    const container = product.querySelector('.seller-info-ct');
    const infoBox = container.querySelector('.seller-info');
    const icon = container.querySelector('.seller-icon');
    const text = container.querySelector('.seller-text');

    // remove loading spinner
    icon.classList.remove('seller-loading');

    // replace "loading..." with real seller name
    text.textContent = product.dataset.sellerName;

    if (product.dataset.sellerId && product.dataset.sellerId !== 'Amazon') {
      // Create link to seller profile if sellerId is valid
      const anchor = document.createElement('a');
      anchor.classList.add('seller-link');
      anchor.appendChild(infoBox);
      container.appendChild(anchor);
      anchor.href = window.location.origin + '/sp?seller=' + product.dataset.sellerId;
    }

    if (product.dataset.blocked) {
      icon.textContent = '⚠️';
      icon.style.fontSize = "1.5em";
      infoBox.title = 'Error 503: Too many requests. Amazon blocked seller page. Please try again in a few minutes.';
      return;
    }

    if (product.dataset.sellerName.includes('Amazon')) {
      // Seller is Amazon or one of its subsidiaries (Warehouse, UK, US, etc.)
      const amazonIcon = document.createElement('img');
      amazonIcon.src = '/favicon.ico';
      icon.appendChild(amazonIcon);
      infoBox.title = product.dataset.sellerName;
      return;
    }

    // 1. Set icon, create infoBox title (if country known)
    if (product.dataset.sellerCountry && product.dataset.sellerCountry != '?') {
      icon.textContent = getFlagEmoji(product.dataset.sellerCountry);
      infoBox.title = (new Intl.DisplayNames([document.documentElement.lang], { type: 'region' })).of(product.dataset.sellerCountry) + ' | ';
    } else {
      icon.textContent = '❓';
      icon.style.fontSize = "1.5em";
    }

    if (!product.dataset.sellerId) {
      console.error('No seller found', product);
      return;
    }

    // 2. Append name to infoBox title
    infoBox.title += product.dataset.sellerName;

    // 3. Append rating to text and infoBox title
    const ratingText = `(${product.dataset.sellerRatingScore} | ${product.dataset.sellerRatingCount})`;
    text.textContent += ` ${ratingText}`;
    infoBox.title += ` ${ratingText}`;
  }

  function findTitle(product) {
    //TODO switch case
    try {
      let title;
      if (product.dataset.avar) {
        title = product.querySelector('.a-color-base.a-spacing-none.a-link-normal');
      } else if (product.parentElement.classList.contains('a-carousel-card')) {
        if (product.classList.contains('a-section') && product.classList.contains('a-spacing-none')) {
          title = product.querySelector('.a-link-normal');
        } else if (product.querySelector('.a-truncate:not([data-a-max-rows="1"])') !== null) {
          title = product.querySelector('.a-truncate');
        } else if (product.querySelector('h2') !== null) {
          title = product.getElementsByTagName("h2")[0];
        } else {
          title = product.querySelectorAll('.a-link-normal')[1];
        }
      } else if (product.id == 'gridItemRoot' || product.closest('#zg') !== null) {
        title = product.querySelectorAll('.a-link-normal')[1];
      } else if (product.classList.contains('octopus-pc-item-v3')) {
        title = product.querySelectorAll('.octopus-pc-asin-title, .octopus-pc-dotd-title')[0];
      } else if (product.classList.contains('octopus-pc-lightning-deal-item-v3')) {
        title = product.querySelector('.octopus-pc-deal-title');
      } else if (product.querySelector('.sponsored-products-truncator-truncated') !== null) {
        title = product.querySelector('.sponsored-products-truncator-truncated');
      } else {
        title = product.getElementsByTagName("h2")[0];
      }
      return title;
    } catch (error) {
      console.error(error, product);
    }
  }

  function fixHeights(product) {
    // fixes for grid-item:
    if (product.id == 'gridItemRoot') {
      product.style.height = product.offsetHeight + 20 + 'px';
    }

    if (product.classList.contains('octopus-pc-item')) {

      const els = document.querySelectorAll('.octopus-pc-card-height-v3, .octopus-dotd-height, .octopus-lightning-deal-height');
      for (const el of els) {
        if (!el.getAttribute('style')) el.style.height = el.offsetHeight + 30 + 'px';
      }

      const text = product.querySelectorAll('.octopus-pc-deal-block-section, .octopus-pc-dotd-info-section')[0];
      if (text) text.style.height = text.offsetHeight + 30 + 'px';

      if (product.classList.contains('octopus-pc-lightning-deal-item-v3') && !product.dataset.height) {
        product.style.setProperty('height', product.offsetHeight + 30 + 'px', 'important');
        product.dataset.height = 'set';
      }
    }

    if (product.closest('#rhf') !== null && product.closest('.a-carousel-viewport') !== null) {
      const els = document.querySelectorAll('.a-carousel-viewport, .a-carousel-left, .a-carousel-right');
      for (const el of els) {
        if (el.getAttribute('style') && !el.dataset.height) {
          el.style.height = el.offsetHeight + 30 + 'px';
          el.dataset.height = 'set';
        }
      }
    }

    // hide stupid blocking links on sponsored products
    if (product.closest('.sbx-desktop') !== null) {
      const links = product.querySelectorAll('a:empty');
      links.forEach((link) => {
        link.style.height = 0;
      });
    }
  }

  function asinKey(product) {
    return 'asin-' + product.dataset.asin;
  }

  function sellerKey(product) {
    return 'seller-' + product.dataset.sellerId
  }

  // Country Code to Flag Emoji (Source: https://dev.to/jorik/country-code-to-flag-emoji-a21)
  function getFlagEmoji(countryCode) {
    const codePoints = countryCode
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  }

  function addGlobalStyle(css) {
    const head = document.getElementsByTagName('head')[0];
    if (!head) return;
    const style = document.createElement('style');
    style.innerHTML = css;
    head.appendChild(style);
  }

  addGlobalStyle(`
  .seller-info-ct {
    cursor: default;
    margin-top: 4px;
  }

  .seller-info {
    display: inline-flex;
    gap: 4px;
    background: #fff;
    font-size: 0.9em;
    padding: 2px 4px;
    border: 1px solid #d5d9d9;
    border-radius: 4px;
    max-width: 100%;
  }

  .seller-loading {
    display: inline-block;
    width: 0.8em;
    height: 0.8em;
    border: 3px solid rgb(255 153 0 / 30%);
    border-radius: 50%;
    border-top-color: #ff9900;
    animation: spin 1s ease-in-out infinite;
    margin: 1px 3px 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .seller-icon {
    vertical-align: text-top;
    text-align: center;
    font-size: 1.8em;
  }

  .seller-icon svg {
    width: 0.8em;
    height: 0.7em;
  }

  .seller-icon img {
    width: 0.82em;
    height: 0.82em;
  }

  .seller-text {
    color: #1d1d1d !important;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  a.seller-link:hover .seller-info {
    box-shadow: 0 2px 5px 0 rgb(213 217 217 / 50%);
    background-color: #f7fafa;
    border-color: #d5d9d9;
  }

  a.seller-link:hover .seller-name {
    text-decoration: underline;
  }

  .product--highlight .s-card-container,
  .product--highlight[data-avar],
  .product--highlight.sbv-product,
  .a-carousel-has-buttons .product--highlight,
  #gridItemRoot.product--highlight,
  #gridItemRoot.product--highlight .a-cardui,
  .product--highlight .octopus-pc-item-image-section,
  .product--highlight .octopus-pc-asin-info-section,
  .product--highlight .octopus-pc-deal-block-section,
  .product--highlight .octopus-pc-dotd-info-section,
  .acswidget-carousel .product--highlight .acs-product-block {
    background-color: #f9e3e4;
    border-color: #f9e3e4;
  }

  #gridItemRoot.product--highlight,
  .product--highlight .s-card-border {
    border-color: #e3abae;
  }

  .product--highlight .s-card-drop-shadow {
    box-shadow: none;
    border: 1px solid #e3abae;
  }

  .product--highlight .s-card-drop-shadow .s-card-border {
    border-color: #f9e3e4;
  }

  .product--highlight[data-avar],
  .a-carousel-has-buttons .product--highlight {
    padding: 0 2px;
    box-sizing: content-box;
  }

  .product--highlight.zg-carousel-general-faceout,
  #rhf .product--highlight {
    box-shadow: inset 0 0 0 1px #e3abae;
    padding: 0 6px;
    word-break: break-all;
  }

  .product--highlight.zg-carousel-general-faceout img,
  #rhf .product--highlight img {
    max-width: 100% !important;
  }

  #rhf .product--highlight img {
    margin: 1px auto -1px;
  }

  .product--highlight a,
  .product--highlight .a-color-base,
  .product--highlight .a-price[data-a-color='base'] {
    color: #842029 !important;
  }

  #gridItemRoot .seller-info {
    margin-bottom: 6px;
  }

  .octopus-pc-item-v3 .seller-info-ct,
  .octopus-pc-lightning-deal-item-v3 .seller-info-ct {
    padding: 4px 20px 0;
  }

  .sbx-desktop .seller-info-ct {
    margin: 0;
  }

  .sp-shoveler .seller-info-ct {
    margin: -2px 0 3px;
  }

  .p13n-sc-shoveler .seller-info-ct {
    margin: 0;
  }

  .octopus-pc-item-image-section-v3 {
    text-align: center;
  }

  #rhf .a-section.a-spacing-mini {
    text-align: center;
  }

  a:hover.a-color-base,
  a:hover.seller-link {
    text-decoration: none;
  }
  `);
})();