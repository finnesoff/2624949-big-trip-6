import AbstractView from '../framework/view/abstract-view.js';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (dateFrom, dateTo) => {
  const durationInMinutes = Math.max(
    0,
    Math.round((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60)),
  );
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;

  if (hours === 0) {
    return `${minutes}M`;
  }

  return `${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M`;
};

const createSelectedOffersTemplate = (selectedOffers) =>
  selectedOffers
    .map(
      (offer) => `
    <li class="event__offer">
      <span class="event__offer-title">${offer.title}</span>
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
        <h3 class="event__title">${point.type} ${destination?.name ?? ''}</h3>
        <div class="event__schedule">
          <p class="event__time">
            <time class="event__start-time" datetime="${point.dateFrom}">${formatTime(point.dateFrom)}</time>
            &mdash;
            <time class="event__end-time" datetime="${point.dateTo}">${formatTime(point.dateTo)}</time>
          </p>
          <p class="event__duration">${formatDuration(point.dateFrom, point.dateTo)}</p>
        </div>
        <p class="event__price">
          &euro;&nbsp;<span class="event__price-value">${point.basePrice}</span>
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

  constructor({ point, destinationsById, offersById, onEditClick }) {
    super();
    this.#point = point;
    this.#destinationsById = destinationsById;
    this.#offersById = offersById;
    this.#handleEditClick = onEditClick;

    this.element.querySelector('.event__rollup-btn').addEventListener('click', this.#editClickHandler);
  }

  #editClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleEditClick();
  };

  get template() {
    const destination = this.#destinationsById.get(this.#point.destinationId);
    const selectedOffers = this.#point.offerIds
      .map((offerId) => this.#offersById.get(offerId))
      .filter(Boolean);

    return createPointTemplate(this.#point, destination, selectedOffers);
  }
}
