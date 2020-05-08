// ==UserScript==
// @name         Udemy - Improved Course Library
// @namespace    https://github.com/TadWohlrapp/UserScripts
// @description  Shows rating, number of reviews and number of students enrolled for all courses in your library
// @icon         https://github.com/TadWohlrapp/UserScripts/raw/master/udemy-improved-course-library/icon.png
// @icon64       https://github.com/TadWohlrapp/UserScripts/raw/master/udemy-improved-course-library/icon64.png
// @author       Tad Wohlrapp <tadwohlrapp@gmail.com>
// @homepageURL  https://github.com/TadWohlrapp/UserScripts/tree/master/udemy-improved-course-library
// @version      0.6.0
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
    if (courseContainers.length == 0) { return; }
    [...courseContainers].forEach((courseContainer) => {
      const courseId = courseContainer.querySelector('.card--learning__image').href.replace('https://www.udemy.com/course-dashboard-redirect/?course_id=', '');

      const courseCustomDiv = document.createElement('div');
      courseCustomDiv.classList.add('card__custom');

      const courseLinkDiv = document.createElement('div');
      courseLinkDiv.innerHTML = '<a href="https://www.udemy.com/course/'
        + courseId
        + '/" target="_blank" rel="noopener" class="card__course-link">'
        + i18n[lang].overview
        + '<svg fill="#686f7a" width="12" height="16" viewBox="0 0 24 24" style="vertical-align: text-bottom;margin-left: 4px;" xmlns="http://www.w3.org/2000/svg">'
        + '<path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14c0 1.1.9 2 2 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.6l-9.8 9.8 1.4 1.4L19 6.4V10h2V3h-7z"></path>'
        + '</svg></a>'
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

      const notAvailable = courseContainer.querySelector('.card--learning__details').href.includes('/draft/');
      if (notAvailable) {
        courseStatsDiv.innerHTML += '<div class="card__nodata">' + i18n[lang].notavailable + '</div>';
        ratingStripDiv.style.backgroundColor = '#faebeb';
        return;
      }

      const fetchUrl = 'https://www.udemy.com/api-2.0/courses/' + courseId + '?fields[course]=rating,num_reviews,num_subscribers,content_length_video';
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
          const rating = json.rating.toFixed(1);
          const reviews = json.num_reviews;
          const enrolled = json.num_subscribers;
          const runtime = json.content_length_video;
          const ratingPercentage = Math.round((rating / 5) * 100);
          const ratingStars = `
            <svg class="card__stars" width="100%" height="100%" viewBox="0 0 70 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="card__star-mask--` + courseId + `">
                <rect x="0" y="0" width="` + ratingPercentage + `%" height="100%" fill="white"></rect>
              </mask>
              <g fill="#dedfe0">
                <use xlink:href="#icon-rating-star" width="14" height="14" x="0"></use>
                <use xlink:href="#icon-rating-star" width="14" height="14" x="14"></use>
                <use xlink:href="#icon-rating-star" width="14" height="14" x="28"></use>
                <use xlink:href="#icon-rating-star" width="14" height="14" x="42"></use>
                <use xlink:href="#icon-rating-star" width="14" height="14" x="56"></use>
              </g>
              <g fill="#f4c150" mask="url(#card__star-mask--` + courseId + `)">
                <use xlink:href="#icon-rating-star" width="14" height="14" x="0"></use>
                <use xlink:href="#icon-rating-star" width="14" height="14" x="14"></use>
                <use xlink:href="#icon-rating-star" width="14" height="14" x="28"></use>
                <use xlink:href="#icon-rating-star" width="14" height="14" x="42"></use>
                <use xlink:href="#icon-rating-star" width="14" height="14" x="56"></use>
              </g>
            </svg>
            `;
          courseStatsDiv.innerHTML = '<div class="card__course-stats">'
            + ratingStars
            + '<span class="card__rating-text">'
            + setDecimal(rating, lang)
            + '</span><span class="card__reviews-text">('
            + setSeparator(reviews, lang)
            + ')</span><br>'
            + setSeparator(enrolled, lang)
            + ' '
            + i18n[lang].enrolled
            + '</div>';
          const getColor = v => `hsl(${((1 - v) * 120)},100%,50%)`;
          const colorValue = Math.min(Math.max((5 - rating) / 2, 0), 1);
          ratingStripDiv.style.backgroundColor = getColor(colorValue);

          // Add course runtime, YouTube style
          const thumbnailDiv = courseContainer.querySelector('.card__image');
          const runtimeSpan = document.createElement('span');
          runtimeSpan.classList.add('card__course-runtime');
          runtimeSpan.innerHTML = parseRuntime(runtime);
          thumbnailDiv.appendChild(runtimeSpan);
        })
        .catch(error => {
          courseStatsDiv.innerHTML += '<div class="card__nodata">' + i18n[lang].notavailable + '</div>';
          ratingStripDiv.style.backgroundColor = '#faebeb';
          console.info('Could not fetch stats for course ' + courseId + '.', error);
        });
    });
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

  function setSeparator(int, lang) {
    return int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, i18n[lang].separator);
  }

  function setDecimal(rating, lang) {
    return rating.toString().replace('.', i18n[lang].decimal);
  }

  function getLang(lang) {
    return i18n.hasOwnProperty(lang) ? lang : 'en-us';
  }

  function addGlobalStyle(css) {
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);
  }

  function parseRuntime(seconds) {
    const h = Math.floor(seconds / 60 / 60);
    const m = Math.floor(seconds / 60) - (h * 60);
    const s = seconds % 60;
    const timeString = h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
    return timeString.replace(/^[0:]+/, '');
  }

  function loadTranslations() {
    return {
      'en-us': {
        'overview': 'Course overview',
        'enrolled': 'students',
        'notavailable': 'Course stats not available',
        'separator': ',',
        'decimal': '.'
      },
      'de-de': {
        'overview': 'Kursübersicht',
        'enrolled': 'Teilnehmer',
        'notavailable': 'Kursstatistiken nicht verfügbar',
        'separator': '.',
        'decimal': ','
      },
      'es-es': {
        'overview': 'Descripción del curso',
        'enrolled': 'estudiantes',
        'notavailable': 'Las estadísticas del curso no están disponibles',
        'separator': '.',
        'decimal': ','
      },
      'fr-fr': {
        'overview': 'Aperçu du cours',
        'enrolled': 'participants',
        'notavailable': 'Statistiques sur les cours non disponibles',
        'separator': ' ',
        'decimal': ','
      },
      'it-it': {
        'overview': 'Panoramica del corso',
        'enrolled': 'studenti',
        'notavailable': 'Statistiche del corso non disponibili',
        'separator': '.',
        'decimal': ','
      }
    };
  }

  addGlobalStyle(`
    span[class^="leave-rating--helper-text"] {
      font-size: 10px;
      white-space: nowrap;
    }
    .card__course-runtime {
      position: absolute;
      bottom: 0;
      right: 0;
      background-color: rgba(0,0,0,0.75);
      color: #ffffff;
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      margin: 4px;
      padding: 2px 4px;
      border-radius: 2px;
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