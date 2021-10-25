# Amazon - Show Seller Info
[![Install](https://img.shields.io/badge/-Install-green?style=flat-square&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAb0lEQVR4Ae3UgQUAMRBE0SvnykhnW0JKSmn/AANikbiB+SxgeWCelBwBA6jmxp+goq8CCiiggE4D3s3oLfrW5vc9RU3uNR9lRwnjRwljQDUYM0oYP0oYA6rBmFHC+FHC2FHCqJSA4n4VUAsyllL6AHMEW1GSXWKaAAAAAElFTkSuQmCC)](https://github.com/tadwohlrapp/amazon-show-seller-info-userscript/raw/main/amazon-show-seller-info.user.js "Click to install") [![Report Issue](https://img.shields.io/badge/-Report%20issue-red?style=flat-square&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAsklEQVR4Ae3UEQzEQBCF4YVzd66nrvWs0+JBPeNUdzzPYT11Onen/3TwLbyl+ZPBSb5sstOq1VXAAEKc7sZczPf2Y3woPyajfBg/yo/JKDfmTr/qVlHOl4m0F+hpKGAAGEG5roBiISgKVKACGQ6jFyRUoAc4gA78HKCTufa025lrKKAX8EFvS7sHeleTmkd9gQ3YgWcWY0ClDBgvKmEMKCNGR/kxflTCuFAnEOKMVlWL+wNsSof8wQFurAAAAABJRU5ErkJggg==)](https://github.com/tadwohlrapp/amazon-show-seller-info-userscript/issues "Click to report issue")

This UserScript displays third party seller name, country of origin and ratings on Amazon's search result page and bestsellers page. Also highlights sellers from specific countries (Default is China and Hong Kong, but can be set for anything).

## This script does NOT work on Amazon.com
It only works on Amazon's European sites, because consumer rights apparently do not exist outside of Europe (i.e. sellers have no obligation to identify themselves)
### Only for: Amazon.co.uk | Amazon.de | Amazon.es | Amazon.fr | Amazon.it

![screenshot](https://user-images.githubusercontent.com/2788192/81297926-51ba6e80-9074-11ea-8e0d-9ed9d03dfab1.png)

## Please note
Amazon blocks access to seller profiles after some repeated requests were made. The seller profile page then returns a 503 server error which of course prevents the script from parsing the seller details. In this case only the seller name is displayed but at least you still see if a listing is sold by Amazon or by a third party seller. Product pages are not affected by this restriction and can be accessed anytime. After a minute or so the seller profile page is reachable again and the script can continue its work.