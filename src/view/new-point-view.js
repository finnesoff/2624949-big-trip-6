import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import { EVENT_TYPES } from '../const.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
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
  basePrice,
  isDisabled,
  isSaving,
}) => {
  const suffix = '';

  return `
    <li class="trip-events__item">
      <form class="event event--edit" action="#" method="post">
        <header class="event__header">
          <div class="event__type-wrapper">
            <label class="event__type  event__type-btn" for="event-type-toggle${suffix}">
              <span class="visually-hidden">Choose event type</span>
              <img class="event__type-icon" width="17" height="17" src="img/icons/${currentType}.png" alt="Event type icon">
            </label>
            <input class="event__type-toggle  visually-hidden" id="event-type-toggle${suffix}" type="checkbox" ${isDisabled ? 'disabled' : ''}>

            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Event type</legend>
                ${createTypeItemsTemplate(currentType, suffix)}
              </fieldset>
            </div>
          </div>

          <div class="event__field-group  event__field-group--destination">
            <label class="event__label  event__type-output" for="event-destination${suffix}">
              ${currentType[0].toUpperCase() + currentType.slice(1)}
            </label>
            <input class="event__input  event__input--destination" id="event-destination${suffix}" type="text" name="event-destination" value="${escapeHTML(destination?.name ?? '')}" placeholder="Choose destination" list="destination-list${suffix}" ${isDisabled ? 'disabled' : ''}>
            <datalist id="destination-list${suffix}">
              ${createDestinationOptionsTemplate(destinations)}
            </datalist>
          </div>

          <div class="event__field-group  event__field-group--time">
            <label class="visually-hidden" for="event-start-time${suffix}">From</label>
            <input class="event__input  event__input--time" id="event-start-time${suffix}" type="text" name="event-start-time" value="" placeholder="Select start date and time" ${isDisabled ? 'disabled' : ''}>
            &mdash;
            <label class="visually-hidden" for="event-end-time${suffix}">To</label>
            <input class="event__input  event__input--time" id="event-end-time${suffix}" type="text" name="event-end-time" value="" placeholder="Select end date and time" ${isDisabled ? 'disabled' : ''}>
          </div>

          <div class="event__field-group  event__field-group--price">
            <label class="event__label" for="event-price${suffix}">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input class="event__input  event__input--price" id="event-price${suffix}" type="number" min="1" required name="event-price" value="${basePrice ?? 0}" placeholder="0" ${isDisabled ? 'disabled' : ''}>
          </div>

          <button class="event__save-btn  btn  btn--blue" type="submit" ${isDisabled ? 'disabled' : ''}>${isSaving ? 'Saving...' : 'Save'}</button>
          <button class="event__reset-btn" type="reset">Cancel</button>
        </header>
        ${(availableOffers.length > 0) || (destination?.description) || (destination?.pictures && destination.pictures.length > 0) ? `
        <section class="event__details">
          ${availableOffers.length > 0 ? `
          <section class="event__section  event__section--offers">
            <h3 class="event__section-title  event__section-title--offers">Offers</h3>
            <div class="event__available-offers">
              ${createOffersTemplate(availableOffers, [], suffix)}
            </div>
          </section>` : ''}

          ${destination?.description || (destination?.pictures && destination.pictures.length > 0) ? `
          <section class="event__section  event__section--destination">
            <h3 class="event__section-title  event__section-title--destination">Destination</h3>
            <p class="event__destination-description">${escapeHTML(destination.description)}</p>
            ${createPhotosTemplate(destination.pictures)}
          </section>` : ''}
        </section>` : ''}
      </form>
    </li>
  `;
};

export default class NewPointView extends AbstractStatefulView {
  #destinations = [];
  #destinationsById = null;
  #offers = [];
  #datepickerFrom = null;
  #datepickerTo = null;

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
        type: 'flight',
        destinationId: null,
        dateFrom: '',
        dateTo: '',
        basePrice: 0,
        offerIds: [],
        isFavorite: false,
      },
      currentType: 'flight',
      currentDestinationId: null,
      isDisabled: false,
      isSaving: false,
    });

    this._restoreHandlers();
  }

  removeElement() {
    super.removeElement();

    if (this.#datepickerFrom) {
      this.#datepickerFrom.destroy();
      this.#datepickerFrom = null;
    }

    if (this.#datepickerTo) {
      this.#datepickerTo.destroy();
      this.#datepickerTo = null;
    }
  }

  get template() {
    const destination = this.#destinationsById.get(this._state.currentDestinationId);
    const currentType = this._state.currentType;
    const availableOffers = this.#offers.filter(
      (offer) => offer.type === currentType,
    );

    // (render-time diagnostics removed)

    return createNewPointTemplate({
      destination,
      destinations: this.#destinations,
      availableOffers,
      currentType,
      basePrice: this._state.point.basePrice,
      isDisabled: this._state.isDisabled,
      isSaving: this._state.isSaving,
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
        offerIds: [],
      },
    });
  };

  #destinationChangeHandler = (evt) => {
    evt.preventDefault();
    const newDestination = this.#destinations.find(
      (destination) => destination.name === evt.target.value,
    );
    if (!newDestination) {
      return;
    }
    this.updateElement({
      currentDestinationId: newDestination.id,
      point: {
        ...this._state.point,
        destinationId: newDestination.id,
      },
    });
  };

  #priceChangeHandler = (evt) => {
    evt.preventDefault();
    this._setState({
      point: {
        ...this._state.point,
        basePrice: parseInt(evt.target.value, 10),
      },
    });
  };

  #offersChangeHandler = (evt) => {
    evt.preventDefault();
    const checkedOffers = Array.from(
      this.element.querySelectorAll('.event__offer-checkbox:checked'),
    );
    this._setState({
      point: {
        ...this._state.point,
        offerIds: checkedOffers.map((offer) =>
          offer.id.replace(/^event-offer-/, '').replace(/-$/, ''),
        ),
      },
    });
  };

  #dateFromChangeHandler = ([userDate]) => {
    this._setState({
      point: {
        ...this._state.point,
        dateFrom: userDate.toISOString(),
      },
    });
  };

  #dateToChangeHandler = ([userDate]) => {
    this._setState({
      point: {
        ...this._state.point,
        dateTo: userDate.toISOString(),
      },
    });
  };

  #setDatepicker() {
    this.#datepickerFrom = flatpickr(
      this.element.querySelector('[id^="event-start-time"]'),
      {
        dateFormat: 'd/m/y H:i',
        enableTime: true,
        'time_24hr': true,
        defaultDate: this._state.point.dateFrom,
        onChange: this.#dateFromChangeHandler,
      },
    );

    this.#datepickerTo = flatpickr(
      this.element.querySelector('[id^="event-end-time"]'),
      {
        dateFormat: 'd/m/y H:i',
        enableTime: true,
        'time_24hr': true,
        defaultDate: this._state.point.dateTo,
        minDate: this._state.point.dateFrom,
        onChange: this.#dateToChangeHandler,
      },
    );
  }

  _restoreHandlers() {
    this.element
      .querySelector('form')
      .addEventListener('submit', this.#formSubmitHandler);
    this.element
      .querySelector('.event__type-group')
      .addEventListener('change', this.#typeChangeHandler);
    this.element
      .querySelector('.event__input--destination')
      .addEventListener('change', this.#destinationChangeHandler);
    this.element
      .querySelector('.event__reset-btn')
      .addEventListener('click', this.#handleCloseClick);
    this.element
      .querySelector('.event__input--price')
      .addEventListener('input', this.#priceChangeHandler);

    const offersElement = this.element.querySelector('.event__available-offers');
    if (offersElement) {
      offersElement.addEventListener('change', this.#offersChangeHandler);
    }

    this.#setDatepicker();
  }
}
