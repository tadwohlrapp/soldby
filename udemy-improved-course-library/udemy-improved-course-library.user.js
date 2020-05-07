// ==UserScript==
// @name         Udemy - Improved Course Library
// @namespace    https://github.com/TadWohlrapp/UserScripts
// @description  Shows rating, number of reviews and number of students enrolled for all courses in your library
// @icon         https://github.com/TadWohlrapp/UserScripts/raw/master/udemy-improved-course-library/icon.png
// @icon64       https://github.com/TadWohlrapp/UserScripts/raw/master/udemy-improved-course-library/icon64.png
// @author       Tad Wohlrapp <tadwohlrapp@gmail.com>
// @homepageURL  https://github.com/TadWohlrapp/UserScripts/tree/master/udemy-improved-course-library
// @version      0.3.0
// @updateURL    https://github.com/TadWohlrapp/UserScripts/raw/master/udemy-improved-course-library/udemy-improved-course-library.meta.js
// @downloadURL  https://github.com/TadWohlrapp/UserScripts/raw/master/udemy-improved-course-library/udemy-improved-course-library.user.js
// @supportURL   https://github.com/TadWohlrapp/UserScripts/issues
// @match        https://www.udemy.com/home/my-courses/*
// @copyright    2020, Tad Wohlrapp (https://github.com/TadWohlrapp/UserScripts)
// @license      MIT
// ==/UserScript==

(function () {
  function fetchCourses() {
    listenForArchiveToggle();
    const courseContainers = document.querySelectorAll('[data-purpose="enrolled-course-card"]:not(.details-done)');
    if (courseContainers.length > 0) {
      [...courseContainers].forEach((courseContainer) => {
        const courseLink = courseContainer.querySelector('.card--learning__image');
        const courseId = courseLink.href.replace('https://www.udemy.com/course-dashboard-redirect/?course_id=', '');
        const courseIdDiv = document.createElement('div');
        courseIdDiv.innerHTML = '<a href="https://www.udemy.com/course/' + courseId + '/" target="_blank" rel="noopener" class="card__course-link">Visit Course overview</a>';
        courseIdDiv.classList.add('card__details', 'custom');
        courseLink.parentNode.appendChild(courseIdDiv);
        courseContainer.classList.add('details-done');

        const fetchUrl = 'https://www.udemy.com/api-2.0/courses/' + courseId + '?fields[course]=avg_rating,num_reviews,num_subscribers';
        fetch(fetchUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json;charset=utf-8' }
        })
          .then(response => response.json())
          .then(function (data) {
            let rating = data.avg_rating;
            let reviews = data.num_reviews;
            let enrolled = data.num_subscribers;
            if (rating) {
              const ratingPercentage = (rating / 5) * 100;
              const ratingStars = `
              <svg class="card__stars" aria-hidden="true" width="100%" height="100%" viewBox="0 0 62 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="card__star-mask--` + courseId + `" data-purpose="star-rating-mask">
                  <rect x="0" y="0" width="` + ratingPercentage + `%" height="100%" fill="white"></rect>
                </mask>
                <g class="card__star--filled" mask="url(#card__star-mask--` + courseId + `)" data-purpose="star-filled">
                  <use xlink:href="#icon-rating-star" width="14" height="14" x="0"></use>
                  <use xlink:href="#icon-rating-star" width="14" height="14" x="12"></use>
                  <use xlink:href="#icon-rating-star" width="14" height="14" x="24"></use>
                  <use xlink:href="#icon-rating-star" width="14" height="14" x="36"></use>
                  <use xlink:href="#icon-rating-star" width="14" height="14" x="48"></use>
                </g>
                <g fill="transparent" class="card__star--bordered" stroke-width="2" data-purpose="star-bordered">
                  <use xlink:href="#icon-rating-star" width="12" height="12" x="1" y="1"></use>
                  <use xlink:href="#icon-rating-star" width="12" height="12" x="13" y="1"></use>
                  <use xlink:href="#icon-rating-star" width="12" height="12" x="25" y="1"></use>
                  <use xlink:href="#icon-rating-star" width="12" height="12" x="37" y="1"></use>
                  <use xlink:href="#icon-rating-star" width="12" height="12" x="49" y="1"></use>
                </g>
              </svg>
              `;
              courseIdDiv.innerHTML += ratingStars + '<span class="card__rating-text">' + rating.toFixed(1) + '</span><span class="card__reviews-text">(' + reviews.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ')</span><br><span class="card__reviews-text">' + enrolled.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' students enrolled<span>';
              const getColor = v => `hsl(${((1 - v) * 120)},100%,50%)`;
              let colorValue = (5 - rating) / 2;
              if (colorValue > 1) { colorValue = 1 };
              const ratingStripDiv = document.createElement('div');
              ratingStripDiv.classList.add('card__rating-strip');
              ratingStripDiv.style.backgroundColor = getColor(colorValue);
              courseLink.parentNode.appendChild(ratingStripDiv);
            } else {
              courseIdDiv.innerHTML += '<div class="card__nodata">Course stats not available</div>';
            }
          })
          .catch(error => console.log(error));
      });
    }
  }

  fetchCourses();

  const mutationObserver = new MutationObserver(fetchCourses);

  const targetNode = document.querySelector('div[data-module-id="my-courses-v3"]');

  const observerConfig = {
    childList: true,
    subtree: true
  }

  mutationObserver.observe(targetNode, observerConfig);

  function listenForArchiveToggle() {
    document.querySelectorAll('[data-purpose="toggle-archived"]').forEach(item => {
      item.addEventListener('click', event => {
        mutationObserver.disconnect();

        const doneContainers = document.querySelectorAll('.details-done');
        [...doneContainers].forEach((doneContainer) => {
          doneContainer.classList.remove('details-done');
          doneContainer.removeChild(doneContainer.querySelector('.card__details.custom'));
        })
        mutationObserver.observe(targetNode, observerConfig);
      });
    });
  }

  function addGlobalStyle(css) {
    const head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    const style = document.createElement('style');
    style.innerHTML = css;
    head.appendChild(style);
  }

  addGlobalStyle(`
    span[class^="leave-rating--helper-text"] {
      font-size: 10px;
    }
    .card__details.custom {
      color: #29303b;
      display: block;
      font-size: 13px;
      padding-top: 0;
    }
    .card__course-link {
      margin-bottom: 3px;
    }
    .card__course-link::after {
      content: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQElEQVR42qXKwQkAIAxDUUdxtO6/RBQkQZvSi8I/pL4BoGw/XPkh4XigPmsUgh0626AjRsgxHTkUThsG2T/sIlzdTsp52kSS1wAAAABJRU5ErkJggg==);
      margin: 0 3px 0 5px;
    }
    .card__stars {
      display: inline-block;
      width: 7rem;
      height: 1.6rem;
      vertical-align: text-bottom;
    }
    .card__star--bordered {
      stroke: #eb8a2f;
    }
    .card__star--filled {
      fill: #eb8a2f;
    }
    .card__rating-text {
      font-weight: 700;
      color: #505763;
      margin-left: 2px;
      margin-right: 6px;
    }
    .card__reviews-text {
      font-size: 12px;
      font-weight: 400;
      color: #686f7a;
    }
    .card__nodata {
      margin: 18px 0 6px;
      color: #73726c;
      font-weight: 500;
    }
    .card__rating-strip {
      height: 4px;
    }
  `);
})();