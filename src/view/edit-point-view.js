import AbstractView from '../framework/view/abstract-view.js';
import { EVENT_TYPES } from '../const';

const createTypeItemsTemplate = (currentType, suffix) =>
  EVENT_TYPES.map(
    (type) => `
    <div class="event__type-item">
      <input id="event-type-${type}-${suffix}" class="event__type-input visually-hidden" type="radio" name="event-type" value="${type}" ${type === currentType ? 'checked' : ''}>
      <label class="event__type-label event__type-label--${type}" for="event-type-${type}-${suffix}">${type}</label>
    </div>
  `,
  ).join('');

const createDestinationOptionsTemplate = (destinations) =>
  destinations
    .map((destination) => `<option value="${destination.name}"></option>`)
    .join('');

const createOffersTemplate = (offers, selectedOfferIds, suffix) =>
  offers
    .map(
      (offer) => `
    <div class="event__offer-selector">
      <input class="event__offer-checkbox visually-hidden" id="event-offer-${offer.id}-${suffix}" type="checkbox" name="event-offer-${offer.id}" ${selectedOfferIds.includes(offer.id) ? 'checked' : ''}>
      <label class="event__offer-label" for="event-offer-${offer.id}-${suffix}">
        <span class="event__offer-title">${offer.title}</span>
        &plus;&euro;&nbsp;
        <span class="event__offer-price">${offer.price}</span>
      </label>
    </div>
  `,
    )
    .join('');

const createPhotosTemplate = (pictures) => {
  if (pictures.length === 0) {
    return '';
  }

  return `
    <div class="event__photos-container">
      <div class="event__photos-tape">
        ${pictures
    .map(
      (picture) =>
        `<img class="event__photo" src="${picture.src}" alt="${picture.description}">`,
    )
    .join('')}
      </div>
    </div>
  `;
};

const createEditPointTemplate = ({
  point,
  destination,
  destinations,
  availableOffers,
  isCreating,
}) => {
  const safePoint = {
    id: point?.id ?? 'new',
    type: point?.type ?? EVENT_TYPES[0],
    destinationName: destination?.name ?? '',
    dateFrom: point?.dateFrom ? point.dateFrom.slice(0, 16) : '',
    dateTo: point?.dateTo ? point.dateTo.slice(0, 16) : '',
    basePrice: point?.basePrice ?? '',
    offerIds: point?.offerIds ?? [],
  };

  const suffix = safePoint.id;

  return `
    <li class="trip-events__item">
      <form class="event event--edit" action="#" method="post">
        <header class="event__header">
          <div class="event__type-wrapper">
            <label class="event__type event__type-btn" for="event-type-toggle-${suffix}">
              <span class="visually-hidden">Choose event type</span>
              <img class="event__type-icon" width="17" height="17" src="img/icons/${safePoint.type}.png" alt="Event type icon">
            </label>
            <input class="event__type-toggle visually-hidden" id="event-type-toggle-${suffix}" type="checkbox">

            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Event type</legend>
                ${createTypeItemsTemplate(safePoint.type, suffix)}
              </fieldset>
            </div>
          </div>

          <div class="event__field-group event__field-group--destination">
            <label class="event__label event__type-output" for="event-destination-${suffix}">
              ${safePoint.type}
            </label>
            <input class="event__input event__input--destination" id="event-destination-${suffix}" type="text" name="event-destination" value="${safePoint.destinationName}" placeholder="Choose destination" list="destination-list-${suffix}">
            <datalist id="destination-list-${suffix}">
              ${createDestinationOptionsTemplate(destinations)}
            </datalist>
          </div>

          <div class="event__field-group event__field-group--time">
            <label class="visually-hidden" for="event-start-time-${suffix}">From</label>
            <input class="event__input event__input--time" id="event-start-time-${suffix}" type="text" name="event-start-time" value="${safePoint.dateFrom}" placeholder="Select start date and time">
            &mdash;
            <label class="visually-hidden" for="event-end-time-${suffix}">To</label>
            <input class="event__input event__input--time" id="event-end-time-${suffix}" type="text" name="event-end-time" value="${safePoint.dateTo}" placeholder="Select end date and time">
          </div>

          <div class="event__field-group event__field-group--price">
            <label class="event__label" for="event-price-${suffix}">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input class="event__input event__input--price" id="event-price-${suffix}" type="text" name="event-price" value="${safePoint.basePrice}" placeholder="0">
          </div>

          <button class="event__save-btn btn btn--blue" type="submit">Save</button>
          <button class="event__reset-btn" type="reset">${isCreating ? 'Cancel' : 'Delete'}</button>
          ${
  isCreating
    ? ''
    : `
            <button class="event__rollup-btn" type="button">
              <span class="visually-hidden">Open event</span>
            </button>
          `
}
        </header>
        <section class="event__details">
          <section class="event__section event__section--offers">
            <h3 class="event__section-title event__section-title--offers">Offers</h3>
            <div class="event__available-offers">
              ${createOffersTemplate(availableOffers, safePoint.offerIds, suffix)}
            </div>
          </section>

          <section class="event__section event__section--destination">
            <h3 class="event__section-title event__section-title--destination">Destination</h3>
            <p class="event__destination-description">${destination?.description ?? ''}</p>
            ${createPhotosTemplate(destination?.pictures ?? [])}
          </section>
        </section>
      </form>
    </li>
  `;
};

export default class EditPointView extends AbstractView {
  #point = null;
  #destinations = [];
  #destinationsById = null;
  #offers = [];
  #isCreating = false;

  #handleFormSubmit = null;
  #handleCloseClick = null;

  constructor({
    point = null,
    destinations = [],
    destinationsById = new Map(),
    offers = [],
    onFormSubmit,
    onCloseClick
  } = {}) {
    super();
    this.#point = point;
    this.#destinations = destinations;
    this.#destinationsById = destinationsById;
    this.#offers = offers;
    this.#isCreating = point === null;
    this.#handleFormSubmit = onFormSubmit;
    this.#handleCloseClick = onCloseClick;

    this.element.querySelector('form').addEventListener('submit', this.#formSubmitHandler);

    if (!this.#isCreating) {
      this.element.querySelector('.event__rollup-btn').addEventListener('click', this.#closeClickHandler);
    }
  }

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    this.#handleFormSubmit();
  };

  #closeClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleCloseClick();
  };

  get template() {
    const destination = this.#point
      ? this.#destinationsById.get(this.#point.destinationId)
      : this.#destinations[0];

    const pointType = this.#point?.type ?? EVENT_TYPES[0];
    const availableOffers = this.#offers.filter(
      (offer) => offer.type === pointType,
    );

    return createEditPointTemplate({
      point: this.#point,
      destination,
      destinations: this.#destinations,
      availableOffers,
      isCreating: this.#isCreating,
    });
  }
}
