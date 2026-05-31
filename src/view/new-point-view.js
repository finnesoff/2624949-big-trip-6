import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import { EVENT_TYPES } from '../const';
import { escapeHTML } from '../utils/common.js';

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
    .map((destination) => `<option value="${escapeHTML(destination.name)}"></option>`)
    .join('');

const createOffersTemplate = (offers, selectedOfferIds, suffix) =>
  offers
    .map(
      (offer) => `
    <div class="event__offer-selector">
      <input class="event__offer-checkbox visually-hidden" id="event-offer-${offer.id}-${suffix}" type="checkbox" name="event-offer-${offer.id}" ${selectedOfferIds.includes(offer.id) ? 'checked' : ''}>
      <label class="event__offer-label" for="event-offer-${offer.id}-${suffix}">
        <span class="event__offer-title">${escapeHTML(offer.title)}</span>
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
        `<img class="event__photo" src="${picture.src}" alt="${escapeHTML(picture.description)}">`,
    )
    .join('')}
      </div>
    </div>
  `;
};

const createNewPointTemplate = ({
  destination,
  destinations,
  availableOffers,
  currentType,
}) => {
  const suffix = 'new';

  return `
    <li class="trip-events__item">
      <form class="event event--edit" action="#" method="post">
        <header class="event__header">
          <div class="event__type-wrapper">
            <label class="event__type event__type-btn" for="event-type-toggle-${suffix}">
              <span class="visually-hidden">Choose event type</span>
              <img class="event__type-icon" width="17" height="17" src="img/icons/${currentType}.png" alt="Event type icon">
            </label>
            <input class="event__type-toggle visually-hidden" id="event-type-toggle-${suffix}" type="checkbox">

            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Event type</legend>
                ${createTypeItemsTemplate(currentType, suffix)}
              </fieldset>
            </div>
          </div>

          <div class="event__field-group event__field-group--destination">
            <label class="event__label event__type-output" for="event-destination-${suffix}">
              ${currentType}
            </label>
            <input class="event__input event__input--destination" id="event-destination-${suffix}" type="text" name="event-destination" value="${escapeHTML(destination?.name ?? '')}" placeholder="Choose destination" list="destination-list-${suffix}">
            <datalist id="destination-list-${suffix}">
              ${createDestinationOptionsTemplate(destinations)}
            </datalist>
          </div>

          <div class="event__field-group event__field-group--time">
            <label class="visually-hidden" for="event-start-time-${suffix}">From</label>
            <input class="event__input event__input--time" id="event-start-time-${suffix}" type="text" name="event-start-time" value="" placeholder="Select start date and time">
            &mdash;
            <label class="visually-hidden" for="event-end-time-${suffix}">To</label>
            <input class="event__input event__input--time" id="event-end-time-${suffix}" type="text" name="event-end-time" value="" placeholder="Select end date and time">
          </div>

          <div class="event__field-group event__field-group--price">
            <label class="event__label" for="event-price-${suffix}">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input class="event__input event__input--price" id="event-price-${suffix}" type="text" name="event-price" value="" placeholder="0">
          </div>

          <button class="event__save-btn btn btn--blue" type="submit">Save</button>
          <button class="event__reset-btn" type="reset">Cancel</button>
        </header>
        <section class="event__details">
          <section class="event__section event__section--offers">
            <h3 class="event__section-title event__section-title--offers">Offers</h3>
            <div class="event__available-offers">
              ${createOffersTemplate(availableOffers, [], 'new')}
            </div>
          </section>

          <section class="event__section event__section--destination">
            <h3 class="event__section-title event__section-title--destination">Destination</h3>
            <p class="event__destination-description">${escapeHTML(destination?.description ?? '')}</p>
            ${createPhotosTemplate(destination?.pictures ?? [])}
          </section>
        </section>
      </form>
    </li>
  `;
};

export default class NewPointView extends AbstractStatefulView {
  #destinations = [];
  #destinationsById = null;
  #offers = [];

  #handleFormSubmit = null;
  #handleCloseClick = null;

  constructor({
    destinations = [],
    destinationsById = new Map(),
    offers = [],
    onFormSubmit,
    onCloseClick,
  } = {}) {
    super();
    this.#destinations = destinations;
    this.#destinationsById = destinationsById;
    this.#offers = offers;
    this.#handleFormSubmit = onFormSubmit;
    this.#handleCloseClick = onCloseClick;

    this._setState({
      point: {
        id: null,
        type: EVENT_TYPES[0],
        destinationId: this.#destinations[0]?.id ?? null,
        dateFrom: new Date().toISOString(),
        dateTo: new Date().toISOString(),
        basePrice: 0,
        offerIds: [],
        isFavorite: false,
      },
      currentType: EVENT_TYPES[0],
      currentDestinationId: this.#destinations[0]?.id ?? null,
    });

    this._restoreHandlers();
  }

  get template() {
    const destination = this.#destinationsById.get(this._state.currentDestinationId);
    const currentType = this._state.currentType;
    const availableOffers = this.#offers.filter(
      (offer) => offer.type === currentType,
    );

    return createNewPointTemplate({
      destination,
      destinations: this.#destinations,
      availableOffers,
      currentType,
    });
  }

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    const point = {
      ...this._state.point,
      type: this._state.currentType,
      destinationId: this._state.currentDestinationId,
    };

    this.#handleFormSubmit(point);
  };

  #typeChangeHandler = (evt) => {
    evt.preventDefault();
    this.updateElement({
      currentType: evt.target.value,
      point: {
        ...this._state.point,
        type: evt.target.value,
      },
    });
  };

  #destinationChangeHandler = (evt) => {
    evt.preventDefault();
    const selectedDestinationName = evt.target.value;
    const selectedDestination = this.#destinations.find(
      (dest) => dest.name === selectedDestinationName,
    );

    if (selectedDestination) {
      this.updateElement({
      currentDestinationId: selectedDestination.id,
      point: {
        ...this._state.point,
        destinationId: selectedDestination.id,
      },
      });
    }
  };

  _restoreHandlers() {
    const suffix = 'new';

    this.element.querySelector('form').addEventListener('submit', this.#formSubmitHandler);

    this.element.querySelectorAll('.event__type-input').forEach((input) => {
      input.addEventListener('change', this.#typeChangeHandler);
    });

    this.element.querySelector(`#event-destination-${suffix}`).addEventListener('change', this.#destinationChangeHandler);
  }
}
