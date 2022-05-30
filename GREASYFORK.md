# Amazon - Show Seller Info
[![Report Issue](https://img.shields.io/badge/-Report%20issue-red?style=flat-square&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAsklEQVR4Ae3UEQzEQBCF4YVzd66nrvWs0+JBPeNUdzzPYT11Onen/3TwLbyl+ZPBSb5sstOq1VXAAEKc7sZczPf2Y3woPyajfBg/yo/JKDfmTr/qVlHOl4m0F+hpKGAAGEG5roBiISgKVKACGQ6jFyRUoAc4gA78HKCTufa025lrKKAX8EFvS7sHeleTmkd9gQ3YgWcWY0ClDBgvKmEMKCNGR/kxflTCuFAnEOKMVlWL+wNsSof8wQFurAAAAABJRU5ErkJggg==)](https://github.com/tadwohlrapp/amazon-show-seller-info-userscript/issues "Click to report issue")

This userscript displays third party seller name, country of origin and ratings on Amazon's search result page and bestsellers page. Also highlights sellers from specific countries (Default is China and Hong Kong, but can be set for anything).

## This script does NOT (yet) work on Amazon.com
At the moment it only works on some of Amazon's European sites, but will get a **2.0 update in June 2022** to also support Amazon.com, as well as Amazon.co.jp, Amazon.com.mx, Amazon.com.tr, Amazon.nl and Amazon.se
### Currently only for: Amazon.co.uk | Amazon.de | Amazon.es | Amazon.fr | Amazon.it

![screenshot](https://user-images.githubusercontent.com/2788192/81297926-51ba6e80-9074-11ea-8e0d-9ed9d03dfab1.png)

## Please note
Amazon blocks access to seller profiles after some repeated requests were made (to prevent automated web scraping). The seller profile page then returns a 503 server error which of course prevents the script from parsing the seller details. In this case only the seller name is displayed but at least you still see if a listing is sold by Amazon or by a third party seller. Product pages are not affected by this restriction and can be accessed anytime. After a minute or so the seller profile page is reachable again and the script can continue its work. **This issue will also be addressed in the 2.0 update.**