# Amazon - Show Seller Info
[![Report Issue](https://img.shields.io/badge/-Report%20issue-%23c3513b?style=flat-square&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAsklEQVR4Ae3UEQzEQBCF4YVzd66nrvWs0+JBPeNUdzzPYT11Onen/3TwLbyl+ZPBSb5sstOq1VXAAEKc7sZczPf2Y3woPyajfBg/yo/JKDfmTr/qVlHOl4m0F+hpKGAAGEG5roBiISgKVKACGQ6jFyRUoAc4gA78HKCTufa025lrKKAX8EFvS7sHeleTmkd9gQ3YgWcWY0ClDBgvKmEMKCNGR/kxflTCuFAnEOKMVlWL+wNsSof8wQFurAAAAABJRU5ErkJggg==)](https://github.com/tadwohlrapp/amazon-show-seller-info-userscript/issues "Click to report issue")

This userscript displays third party seller name, country of origin and ratings on Amazon's search results and bestsellers pages. It also highlights sellers from specific countries (Default is China and Hong Kong, but can be set for anything).

## Compatibility
This script works on all Amazon marketplaces which publish third party seller's addresses on their Seller Information Page. At this point those are (in alphabetical order):
* 🇯🇵 amazon.co.jp
* 🇬🇧 amazon.co.uk
* 🇺🇸 **amazon.com**
* 🇲🇽 amazon.com.mx
* 🇹🇷 amazon.com.tr
* 🇩🇪 amazon.de
* 🇪🇸 amazon.es
* 🇫🇷 amazon.fr
* 🇮🇹 amazon.it
* 🇳🇱 amazon.nl
* 🇸🇪 amazon.se

## Screenshot
<img width="720" alt="Screenshot" src="https://user-images.githubusercontent.com/2788192/171596756-b16fd466-fd5e-4869-95d5-92918cab2a98.png">

## Please note
Amazon blocks access to seller profiles after some repeated requests were made (to prevent automated web scraping). The seller profile page then returns a 503 server error which of course prevents the script from parsing the seller details. In this case only the seller name is displayed but at least you still see if a listing is sold by Amazon or by a third party seller. Product pages are not affected by this restriction and can be accessed anytime. After a minute or so the seller profile page is reachable again and the script can continue its work.

***This issue will be addressed in the next update!***