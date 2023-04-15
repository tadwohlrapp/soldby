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
// @version         1.6.4
// @license         MIT
// @homepageURL     https://github.com/tadwohlrapp/soldby
// @supportURL      https://github.com/tadwohlrapp/soldby/issues
// @updateURL       https://greasyfork.org/scripts/402064/code/script.meta.js
// @downloadURL     https://greasyfork.org/scripts/402064/code/script.user.js
// @icon            https://github.com/tadwohlrapp/soldby/raw/main/userscript/img/icon.png
// @match           https://www.amazon.co.jp/*
// @match           https://www.amazon.co.uk/*
// @match           https://www.amazon.com/*
// @match           https://www.amazon.com.be/*
// @match           https://www.amazon.com.mx/*
// @match           https://www.amazon.com.tr/*
// @match           https://www.amazon.de/*
// @match           https://www.amazon.es/*
// @match           https://www.amazon.fr/*
// @match           https://www.amazon.it/*
// @match           https://www.amazon.nl/*
// @match           https://www.amazon.se/*
// @require         https://openuserjs.org/src/libs/sizzle/GM_config.min.js
// @grant           GM_getValue
// @grant           GM_setValue
// @compatible      firefox Tested on Firefox v101 with Violentmonkey v2.13.0, Tampermonkey v4.17.6161 and Greasemonkey v4.11
// @compatible      chrome Tested on Chrome v102 with Violentmonkey v2.13.0 and Tampermonkey v4.16.1
// ==/UserScript==

(function () {
  'use strict';

  const frame = document.createElement('div');
  frame.classList.add('sb-options');

  const backdrop = document.createElement('div');
  backdrop.classList.add('sb-options--backdrop');

  document.body.appendChild(frame);
  document.body.appendChild(backdrop);

  GM_config.init({
    'id': 'sb-settings',
    'title': 'SoldBy Settings',
    'fields': {
      'countries': {
        'section': ['Countries to highlight',
          'Country codes as per ISO 3166-1 alpha-2, separated by a comma or space.'],
        'label': 'List of country codes',
        'type': 'text',
        'default': 'CN, HK'
      },
      'unknown': {
        'section': ['Highlight undetectable countries',
          'Some sellers have incomplete/invalid profiles with their country of origin missing.'],
        'label': 'Highlight products sold from unknown countries',
        'type': 'checkbox',
        'default': true
      },
      'hide': {
        'section': ['Hide products instead of highlighting them',
          'If you get overwhelmed by the sheer mass of highlighted product listings, maybe you want to hide them completely.'],
        'label': 'Yes, hide all highlighted products',
        'type': 'checkbox',
        'default': false
      },
      'max-asin-age': {
        'section': ['Check every x days if the seller for a product has changed',
          'For better performance, SoldBy caches product-seller relationships in your browser\'s local storage for one day (24 hours). You can change that value here.'],
        'label': 'Number of days after which a product should be re-fetched',
        'type': 'int',
        'default': 1
      },
      'max-seller-age': {
        'section': ['Check every x days if a seller has new ratings (or has moved countries)',
          'For better performance, SoldBy caches a seller\'s ratings and country in your browser\'s local storage for one week (7 days). You can change that value here.'],
        'label': 'Number of days after which a seller should be re-fetched',
        'type': 'int',
        'default': 7
      }
    },
    'events': {
      'init': () => {
        GM_config.css.basic = '';
      },
      'open': () => {
        GM_config.frame.removeAttribute('style');
        backdrop.style.display = 'block';

        const buttons = frame.querySelectorAll('button');
        wrapBtn(buttons[0], true);
        wrapBtn(buttons[1]);

        backdrop.addEventListener('click', () => {
          GM_config.close();
        });
        document.onkeydown = function (evt) {
          evt = evt || window.event;
          var isEscape = false;
          if ("key" in evt) isEscape = (evt.key === "Escape" || evt.key === "Esc");
          if (isEscape) GM_config.close();
        };
      },
      'save': () => {
        GM_config.close();
      },
      'close': () => {
        backdrop.removeAttribute('style');
      },
    },
    'frame': frame
  });

  // Link to Settings in Footer:
  try {
    const settingsLink = document.createElement('button');
    const navFooterCopyright = document.querySelector('.navFooterCopyright');
    navFooterCopyright.appendChild(settingsLink);
    settingsLink.addEventListener('click', () => { GM_config.open(); });
    settingsLink.textContent = '⚙️ SoldBy';
    wrapBtn(settingsLink, false, true);
  } catch {
    console.error('Could not add settings link');
  }

  const countriesArr = GM_config.get('countries').split(/(?:,| )+/);
  if (GM_config.get('unknown')) countriesArr.push('?');

  const options = {
    maxAgeAsinFetch: GM_config.get('max-asin-age'),
    maxAgeSellerFetch: GM_config.get('max-seller-age'),
    highlightedCountries: countriesArr,
    hideHighlightedProducts: GM_config.get('hide')
  };

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
        getSellerIdAndNameFromLocalStorage(product);
      } else {
        getSellerIdAndNameFromProductPage(product);
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

  function getSellerIdAndNameFromLocalStorage(product) {
    const { sid: sellerId, sn: sellerName, ts: timeStamp } = JSON.parse(localStorage.getItem(asinKey(product)));

    validateItemAge(product, timeStamp, 'asin');

    if (sellerId) product.dataset.sellerId = sellerId;
    product.dataset.sellerName = sellerName;
    setSellerDetails(product);
  }

  function getSellerIdAndNameFromProductPage(product, refetch = false) {
    // fetch seller, get data, save in local storage, set attributes

    if (!product.dataset.asin) return;

    if (refetch) console.log('Re-fetching ' + asinKey(product) + ' from product page');

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
          '#exports_desktop_qualifiedBuybox :not(#usedAccordionRow) #sellerProfileTriggerId',
          '#exports_desktop_qualifiedBuybox :not(#usedAccordionRow) #merchant-info a:first-of-type',
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
          sellerName = thirdPartySeller.textContent.trim().replaceAll('"', '“');
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
      getSellerCountryAndRatingfromLocalStorage(product);
    } else {
      getSellerCountryAndRatingfromSellerPage(product);
    }
  }

  function getSellerCountryAndRatingfromLocalStorage(product) {

    // seller key found in local storage
    const { c: country, rs: ratingScore, rc: ratingCount, ts: timeStamp } = JSON.parse(localStorage.getItem(sellerKey(product)));

    validateItemAge(product, timeStamp, 'seller');

    product.dataset.sellerCountry = country;
    product.dataset.sellerRatingScore = ratingScore;
    product.dataset.sellerRatingCount = ratingCount;

    highlightProduct(product);
    populateInfoBox(product);
  }

  function getSellerCountryAndRatingfromSellerPage(product, refetch = false) {
    // seller key not found in local storage. fetch seller details from seller-page

    if (refetch) console.log('Re-fetching ' + sellerKey(product) + ' from product page');

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

  function getSellerDetailsFromSellerPage(sellerPage) {
    // Detect Amazon's 2022-04-20 redesign
    const sellerProfileContainer = sellerPage.getElementById('seller-profile-container');
    const isRedesign = sellerProfileContainer.classList.contains('spp-redesigned');

    const country = getSellerCountryFromSellerPage(sellerPage, isRedesign); // returns DE
    const rating = getSellerRatingFromSellerPage(sellerPage); // returns 91%

    return { country, rating };
  }

  function getSellerCountryFromSellerPage(sellerPage, isRedesign) {
    let country;
    if (isRedesign) {
      let addressArr = sellerPage.querySelectorAll('#page-section-detail-seller-info .a-box-inner .a-row.a-spacing-none.indent-left');
      country = addressArr[addressArr.length - 1]?.textContent.toUpperCase();
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

  function getSellerRatingFromSellerPage(sellerPage) {
    if (sellerPage.getElementById('seller-name').textContent.includes('Amazon')) {
      return false; // seller is Amazon subsidiary and doesn't display ratings
    }

    let feedbackEl = sellerPage.getElementById('seller-info-feedback-summary')
    let text = feedbackEl.querySelector('.feedback-detail-description').textContent
    let starText = feedbackEl.querySelector('.a-icon-alt').textContent
    text = text.replace(starText, '')
    let regex = /(\d+%).*?\((\d+)/;
    let zeroPercent = '0%';

    const lang = document.documentElement.lang
    // Turkish places the percentage sign in front (e.g. %89)
    if (lang === 'tr-tr') {
      regex = /(%\d+).*?\((\d+)/;
      zeroPercent = '%0';
    }

    // Special treatment for amazon.de in German and amazon.com.be in French
    if (lang === 'de-de' || lang === 'fr-be') {
      regex = /(\d+ %).*?\((\d+)/;
      zeroPercent = '0 %';
    }

    let rating = text.match(regex);
    let score = rating ? rating[1] : zeroPercent;
    let count = rating ? rating[2] : '0';

    return { score, count };
  }

  function highlightProduct(product) {
    if (!options.highlightedCountries.includes(product.dataset.sellerCountry)) return;

    // Highlight sellers from countries defined in 'options.highlightedCountries'
    product.classList.add('product--highlight');

    if (!options.hideHighlightedProducts) return;

    // When hideHighlightedProducts is true: Find correct element to hide
    let hiddenElement = product;
    if (product.parentElement.classList.contains('a-carousel-card')) {
      hiddenElement = product.parentElement;
    }
    if (product.closest('.sbx-desktop') !== null) {
      hiddenElement = product.closest('.sbx-desktop');
    }
    if (product.classList.contains('sbv-product')) {
      hiddenElement = product.closest('.s-result-item');
    }
    hiddenElement.classList.add('sb--hide');
  }

  function createInfoBox(product) {
    const infoBoxCt = document.createElement('div');
    infoBoxCt.classList.add('seller-info-ct', 'a-size-small');

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

  // wrap function to create buttons with amazon's ui
  function wrapBtn(el, primary = false, small = false) {
    const wrapper = document.createElement('span');
    el.classList.add('a-button-inner', 'a-button-text');
    wrapper.classList.add('a-button');
    if (primary) wrapper.classList.add('a-button-primary');
    if (small) wrapper.classList.add('a-button-small');
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }

  // validate storage item age and trigger re-fetch if needed
  function validateItemAge(product, itemTimeStamp, itemType) {
    const currentItemAge = Date.now() - parseInt(itemTimeStamp);
    let allowedItemAge, key, refetchFunction;

    switch (itemType) {
      case 'asin':
        allowedItemAge = options.maxAgeAsinFetch * 1000 * 3600 * 24;
        key = asinKey;
        refetchFunction = getSellerIdAndNameFromProductPage;
        break;
      case 'seller':
        allowedItemAge = options.maxAgeSellerFetch * 1000 * 3600 * 24;
        key = sellerKey;
        refetchFunction = getSellerCountryAndRatingfromSellerPage;
        break;
    }

    if (currentItemAge > allowedItemAge) {
      console.warn('Storage item ' + key(product) + ' is ' + readableItemAge(currentItemAge) + ' old. We must re-fetch it');
      return refetchFunction(product, true);
    }
  }

  // convert storage item age from millisecs to days and hours
  function readableItemAge(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const daysms = ms % (24 * 60 * 60 * 1000);
    const hours = Math.floor(daysms / (60 * 60 * 1000));
    return days + ' days and ' + hours + ' hours';
  }

  function addGlobalStyle(css) {
    const head = document.getElementsByTagName('head')[0];
    if (!head) return;
    const style = document.createElement('style');
    style.innerHTML = css;
    head.appendChild(style);
  }

  addGlobalStyle(`
  .sb--hide {
    display: none !important;
  }

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

  .sb-options {
    display: none;
    left: 50%;
    margin: 5vh auto;
    max-height: 90vh;
    max-width: 80vw;
    overflow-y: auto;
    position: fixed;
    top: 0;
    transform: translateX(-50%);
    width: 666px;
    z-index: 999;
    background-color: white;
    padding: 1rem;
  }

  .sb-options--backdrop {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.4);
    user-select: none;
    z-index: 199;
  }

  #sb-settings * {
    font-family: inherit;
  }

  #sb-settings .config_var {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
  }

  #sb-settings .config_var input[type="checkbox"] {
    margin-right: 4px;
    min-width: 13px;
  }

  #sb-settings #sb-settings_countries_var,
  #sb-settings #sb-settings_max-asin-age_var,
  #sb-settings #sb-settings_max-seller-age_var {
    flex-direction: column-reverse;
  }

  #sb-settings .config_header {
    font-size: 165%;
    line-height: 32px;
  }

  #sb-settings_header::before {
    content: '';
    display: inline-block;
    width: 32px;
    height: 32px;
    background: url(https://github.com/tadwohlrapp/soldby/raw/main/userscript/img/icon.png);
    background-size: contain;
    margin-right: 12px;
    vertical-align: bottom;
  }

  #sb-settings .config_header,
  #sb-settings .config_var {
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: 1px solid #ccc;
  }

  #sb-settings .section_header {
    font-size: 110%;
    font-weight: 500;
  }

  #sb-settings .section_desc {
    color: #666;
    background: #fff;
  }

  #sb-settings label {
    font-weight: 500;
  }

  #sb-settings_buttons_holder {
    display: flex;
    flex-direction: row-reverse;
    gap: 12px;
    align-items: center;
  }
  `);
})();

