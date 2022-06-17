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
// @version         1.6.0
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
// @require         https://openuserjs.org/src/libs/sizzle/GM_config.min.js
// @grant           GM_getValue
// @grant           GM_setValue
// @compatible      firefox Tested on Firefox v101 with Violentmonkey v2.13.0, Tampermonkey v4.17.6161 and Greasemonkey v4.11
// @compatible      chrome Tested on Chrome v102 with Violentmonkey v2.13.0 and Tampermonkey v4.16.1
// ==/UserScript==

// Kept for a while to forward legacy installations to the updated URLs