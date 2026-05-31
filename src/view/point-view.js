import AbstractView from '../framework/view/abstract-view.js';
import dayjs from 'dayjs';
import { escapeHTML } from '../utils/common.js';

const formatDate = (dateString) => dayjs(dateString).format('MMM D').toUpperCase();

const formatTime = (dateString) => dayjs(dateString).format('HH:mm');

const formatDuration = (dateFrom, dateTo) => {
  const start = dayjs(dateFrom);
  const end = dayjs(dateTo);
  const diffInMinutes = end.diff(start, 'minute');

  const days = Math.floor(diffInMinutes / (24 * 60));
  const hours = Math.floor((diffInMinutes % (24 * 60)) / 60);
  const minutes = diffInMinutes % 60;

  if (days > 0) {
    return `${String(days).padStart(2, '0')}D ${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M`;
  }
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M`;
  }
  return `${String(minutes).padStart(2, '0')}M`;
};

const createSelectedOffersTemplate = (selectedOffers) =>
  selectedOffers
    .map(
      (offer) => `
    <li class="event__offer">
      <span class="event__offer-title">${escapeHTML(offer.title)}</span>
      &plus;&euro;&nbsp;
      <span class="event__offer-price">${offer.price}</span>
    </li>
  `,
    )
    .join('');

function createPointTemplate(point, destination, selectedOffers) {
  return `
    <li class="trip-events__item">
      <div class="event">
        <time class="event__date" datetime="${point.dateFrom}">${formatDate(point.dateFrom)}</time>
        <div class="event__type">
          <img class="event__type-icon" width="42" height="42" src="img/icons/${point.type}.png" alt="Event type icon">
        </div>
        <h3 class="event__title">${point.type} ${escapeHTML(destination?.name ?? '')}</h3>
        <div class="event__schedule">
          <p class="event__time">
            <time class="event__start-time" datetime="${point.dateFrom}">${formatTime(point.dateFrom)}</time>
            &mdash;
            <time class="event__end-time" datetime="${point.dateTo}">${formatTime(point.dateTo)}</time>
          </p>
          <p class="event__duration">${formatDuration(point.dateFrom, point.dateTo)}</p>
        </div>
        <p class="event__price">
          &euro;&nbsp;<span class="event__price-value">${escapeHTML(String(point.basePrice))}</span>
        </p>
        <h4 class="visually-hidden">Offers:</h4>
        <ul class="event__selected-offers">
          ${createSelectedOffersTemplate(selectedOffers)}
        </ul>
        <button class="event__favorite-btn ${point.isFavorite ? 'event__favorite-btn--active' : ''}" type="button">
          <span class="visually-hidden">Add to favorite</span>
          <svg class="event__favorite-icon" width="28" height="28" viewBox="0 0 28 28">
            <path d="M14 21l-8.22899 4.3262 1.57159-9.1631L.685209 9.67376 9.8855 8.33688 14 0l4.1145 8.33688 9.2003 1.33688-6.6574 6.48934 1.5716 9.1631L14 21z"></path>
          </svg>
        </button>
        <button class="event__rollup-btn" type="button">
          <span class="visually-hidden">Open event</span>
        </button>
      </div>
    </li>
  `;
}

export default class PointView extends AbstractView {
  #point = null;
  #destinationsById = null;
  #offersById = null;

  #handleEditClick = null;
  #handleFavoriteClick = null;

  constructor({ point, destinationsById, offersById, onEditClick, onFavoriteClick }) {
    super();
    this.#point = point;
    this.#destinationsById = destinationsById;
    this.#offersById = offersById;
    this.#handleEditClick = onEditClick;
    this.#handleFavoriteClick = onFavoriteClick;

    this.element.querySelector('.event__favorite-btn').addEventListener('click', this.#favoriteClickHandler);
    this.element.querySelector('.event__rollup-btn').addEventListener('click', this.#editClickHandler);
  }

  get template() {
    const destination = this.#destinationsById.get(this.#point.destinationId);
    const selectedOffers = this.#point.offerIds
      .map((offerId) => this.#offersById.get(offerId))
      .filter(Boolean);

    return createPointTemplate(this.#point, destination, selectedOffers);
  }

  #favoriteClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleFavoriteClick({
      ...this.#point,
      isFavorite: !this.#point.isFavorite,
    });
  };

  #editClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleEditClick();
  };
}
