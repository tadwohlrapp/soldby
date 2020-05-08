// ==UserScript==
// @name         Udemy - Improved Course Library
// @namespace    https://github.com/TadWohlrapp/UserScripts
// @description  Shows rating, number of reviews and number of students enrolled for all courses in your library
// @icon         https://github.com/TadWohlrapp/UserScripts/raw/master/udemy-improved-course-library/icon.png
// @icon64       https://github.com/TadWohlrapp/UserScripts/raw/master/udemy-improved-course-library/icon64.png
// @author       Tad Wohlrapp <tadwohlrapp@gmail.com>
// @homepageURL  https://github.com/TadWohlrapp/UserScripts/tree/master/udemy-improved-course-library
// @version      0.4.0
// @updateURL    https://github.com/TadWohlrapp/UserScripts/raw/master/udemy-improved-course-library/udemy-improved-course-library.meta.js
// @downloadURL  https://github.com/TadWohlrapp/UserScripts/raw/master/udemy-improved-course-library/udemy-improved-course-library.user.js
// @supportURL   https://github.com/TadWohlrapp/UserScripts/issues
// @match        https://www.udemy.com/home/my-courses/*
// @compatible   chrome Tested with Tampermonkey v4.9 and Violentmonkey v2.12.7
// @compatible   firefox Tested with Greasemonkey v4.9
// @copyright    2020, Tad Wohlrapp (https://github.com/TadWohlrapp/UserScripts)
// @license      MIT
// ==/UserScript==

// ==OpenUserJS==
// @author Taddiboy
// ==/OpenUserJS==

(function () {
  const i18n = loadTranslations();
  function fetchCourses() {
    listenForArchiveToggle();
    const lang = getLang(document.documentElement.lang);
    const courseContainers = document.querySelectorAll('[data-purpose="enrolled-course-card"]:not(.details-done)');
    if (courseContainers.length > 0) {
      [...courseContainers].forEach((courseContainer) => {
        const courseId = courseContainer.querySelector('.card--learning__image').href.replace('https://www.udemy.com/course-dashboard-redirect/?course_id=', '');
        
        const courseCustomDiv = document.createElement('div');
        courseCustomDiv.classList.add('card__custom');

        const courseLinkDiv = document.createElement('div');
        courseLinkDiv.innerHTML = '<a href="https://www.udemy.com/course/' + courseId + '/" target="_blank" rel="noopener" class="card__course-link">' + i18n[lang].overview + '</a>';
        courseLinkDiv.classList.add('card__custom-row');
        courseCustomDiv.appendChild(courseLinkDiv);

        const courseStatsDiv = document.createElement('div');
        courseStatsDiv.classList.add('card__custom-row', 'card__course-stats-ct');
        courseCustomDiv.appendChild(courseStatsDiv);

        const ratingStripDiv = document.createElement('div');
        ratingStripDiv.style.height = '4px';
        courseCustomDiv.appendChild(ratingStripDiv);

        courseContainer.appendChild(courseCustomDiv);
        courseContainer.classList.add('details-done');

        const fetchUrl = 'https://www.udemy.com/api-2.0/courses/' + courseId + '?fields[course]=rating,num_reviews,num_subscribers';
        fetch(fetchUrl)
          .then(response => {
            if (response.ok) {
              return response.json();
            } else if (response.status === 403) {
              throw new Error('This course is no longer accepting enrollments.');
            } else {
              throw new Error(response.status);
            }
          })
          .then(json => {
            if (typeof json === 'undefined') { return; }
            const rating = json.rating;
            const reviews = json.num_reviews;
            const enrolled = json.num_subscribers;
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
            courseStatsDiv.innerHTML = '<div class="card__course-stats">'
              + ratingStars
              + '<span class="card__rating-text">'
              + rating.toFixed(1)
              + '</span><span class="card__reviews-text">('
              + separator(reviews, lang)
              + ')</span><br>'
              + separator(enrolled, lang)
              + ' '
              + i18n[lang].enrolled
              + '</div>';
            const getColor = v => `hsl(${((1 - v) * 120)},100%,50%)`;
            const colorValue = Math.min(Math.max((5 - rating) / 2, 0), 1);
            ratingStripDiv.style.backgroundColor = getColor(colorValue);
          })
          .catch(error => {
            courseStatsDiv.innerHTML += '<div class="card__nodata">' + i18n[lang].notavailable + '</div>';
            ratingStripDiv.style.backgroundColor = '#faebeb';
            console.info('Could not fetch stats for course ' + courseId + '.', error);
          });
      });
    }
  }

  fetchCourses();

  const mutationObserver = new MutationObserver(fetchCourses);

  const targetNode = document.querySelector('div[data-module-id="my-courses-v3"]');

  const observerConfig = {
    childList: true,
    subtree: true
  };

  mutationObserver.observe(targetNode, observerConfig);

  function listenForArchiveToggle() {
    document.querySelectorAll('[data-purpose="toggle-archived"]').forEach(item => {
      item.addEventListener('click', event => {
        mutationObserver.disconnect();

        const doneContainers = document.querySelectorAll('.details-done');
        [...doneContainers].forEach((doneContainer) => {
          doneContainer.classList.remove('details-done');
          doneContainer.removeChild(doneContainer.querySelector('.card__custom'));
        });
        mutationObserver.observe(targetNode, observerConfig);
      });
    });
  }

  function separator(int, lang) {
    return int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, i18n[lang].separator);
  }

  function getLang(lang) {
    if (!i18n.hasOwnProperty(lang)){
      lang = 'en-us';
    }
    return lang;
  }

  function addGlobalStyle(css) {
    const head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    const style = document.createElement('style');
    style.innerHTML = css;
    head.appendChild(style);
  }

  function loadTranslations() {
    return {
      'en-us': {
        'overview': 'Course overview',
        'enrolled': 'students',
        'notavailable': 'Course stats not available',
        'separator': ','
      },
      'de-de': {
        'overview': 'Kursübersicht',
        'enrolled': 'Teilnehmer',
        'notavailable': 'Kursstatistiken nicht verfügbar',
        'separator': '.'
      },
      'es-es': {
        'overview': 'Descripción del curso',
        'enrolled': 'estudiantes',
        'notavailable': 'Las estadísticas del curso no están disponibles',
        'separator': '.'
      },
      'fr-fr': {
        'overview': 'Aperçu du cours',
        'enrolled': 'participants',
        'notavailable': 'Statistiques sur les cours non disponibles',
        'separator': ' '
      },
      'it-it': {
        'overview': 'Panoramica del corso',
        'enrolled': 'studenti',
        'notavailable': 'Statistiche del corso non disponibili',
        'separator': '.'
      }
    };
  }

  addGlobalStyle(`
    span[class^="leave-rating--helper-text"] {
      font-size: 10px;
    }
    .card__custom-row {
      color: #29303b;
      font-size: 13px;
      padding: 0 15px;
    }
    .card__course-link {
      color: #007791 !important;
      display: inline-block !important;
    }
    .card__course-link:hover {
      color: #003845 !important;
    }
    .card__course-link::after {
      content: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQElEQVR42qXKwQkAIAxDUUdxtO6/RBQkQZvSi8I/pL4BoGw/XPkh4XigPmsUgh0626AjRsgxHTkUThsG2T/sIlzdTsp52kSS1wAAAABJRU5ErkJggg==);
      margin: 0 3px 0 5px;
    }
    .card__course-stats-ct {
      height: 48px;
      display: flex;
      align-items: center;
    }
    .card__course-stats {
      font-size: 12px;
      font-weight: 400;
      color: #686f7a;
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
    .card__nodata {
      color: #73726c;
      font-weight: 500;
    }
  `);
})();