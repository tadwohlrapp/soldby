# SoldBy - Reveal Sellers on Amazon

[![Install](https://img.shields.io/badge/-Install-%23607f01?style=flat-square&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAb0lEQVR4Ae3UgQUAMRBE0SvnykhnW0JKSmn/AANikbiB+SxgeWCelBwBA6jmxp+goq8CCiiggE4D3s3oLfrW5vc9RU3uNR9lRwnjRwljQDUYM0oYP0oYA6rBmFHC+FHC2FHCqJSA4n4VUAsyllL6AHMEW1GSXWKaAAAAAElFTkSuQmCC)](https://greasyfork.org/scripts/402064/code/script.user.js 'Click to install from greasyfork.org') [![Report Issue](https://img.shields.io/badge/-Report%20issue-%23c3513b?style=flat-square&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAsklEQVR4Ae3UEQzEQBCF4YVzd66nrvWs0+JBPeNUdzzPYT11Onen/3TwLbyl+ZPBSb5sstOq1VXAAEKc7sZczPf2Y3woPyajfBg/yo/JKDfmTr/qVlHOl4m0F+hpKGAAGEG5roBiISgKVKACGQ6jFyRUoAc4gA78HKCTufa025lrKKAX8EFvS7sHeleTmkd9gQ3YgWcWY0ClDBgvKmEMKCNGR/kxflTCuFAnEOKMVlWL+wNsSof8wQFurAAAAABJRU5ErkJggg==)](https://github.com/tadwohlrapp/soldby/issues 'Click to report issue')

This userscript displays third party seller's name, country of origin and ratings on Amazon.

It also highlights sellers from China and Hong Kong.

To set different countries in the script's options scroll to the very bottom of the amazon page and click this little button:

<img width="752" alt="image" src="https://user-images.githubusercontent.com/2788192/174012811-0c90facd-74d2-4e48-a2e7-22d89e832a0e.png">

## Compatibility

This script works on all Amazon marketplaces which publish third party seller's addresses on their seller profile page. At this point those are (in alphabetical order):

- 🇯🇵 amazon.co.jp
- 🇬🇧 amazon.co.uk
- 🇺🇸 **amazon.com**
- 🇧🇪 amazon.com.be
- 🇲🇽 amazon.com.mx
- 🇹🇷 amazon.com.tr
- 🇩🇪 amazon.de
- 🇪🇸 amazon.es
- 🇫🇷 amazon.fr
- 🇮🇹 amazon.it
- 🇳🇱 amazon.nl
- 🇸🇪 amazon.se

## Installation

To use userscripts you need to first install a userscript manager. They come as extensions for various browsers:

- [Violentmonkey](https://violentmonkey.github.io/) - for Chrome, Edge, Firefox, Opera
- [Tampermonkey](https://tampermonkey.net/) - for Chrome, Edge, Safari, Firefox, Opera

After you have installed a userscript manager, head over to [greasyfork.org/scripts/402064](https://greasyfork.org/scripts/402064) or simply click the green "Install" button above.

## Screenshot

<img width="720" alt="Screenshot" src="https://user-images.githubusercontent.com/2788192/171596756-b16fd466-fd5e-4869-95d5-92918cab2a98.png">

## Please note

Amazon blocks access to seller profiles after some repeated requests were made (to prevent automated web scraping). The seller profile page then returns a 503 server error which of course prevents the script from parsing the seller details. In this case only the seller name is displayed but at least you still see if a listing is sold by Amazon or by a third party seller. Product pages are not affected by this restriction and can be accessed anytime. After a minute or so the seller profile page is reachable again and the script can continue its work.

Since v1.3.0 this issue is addressed by using local storage to cache the results. This should result in way fewer 503 errors, so make sure to [update to the latest version](https://greasyfork.org/scripts/402064/code/script.user.js 'Update from greasyfork.org')!
