import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import { EVENT_TYPES } from '../const.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import dayjs from 'dayjs';
import { escapeHTML } from '../utils/common.js';

const createTypeItemsTemplate = (currentType, suffix, isDisabled) =>
  EVENT_TYPES.map(
    (type) => `
    <div class="event__type-item">
      <input id="event-type-${type}-${suffix}" class="event__type-input visually-hidden" type="radio" name="event-type" value="${type}" ${type === currentType ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
      <label class="event__type-label event__type-label--${type}" for="event-type-${type}-${suffix}">${type}</label>
    </div>
  `,
  ).join('');

const createDestinationOptionsTemplate = (destinations) =>
  destinations
    .map((destination) => `<option value="${escapeHTML(destination.name)}"></option>`)
    .join('');

const createOffersTemplate = (offers, selectedOfferIds, suffix, isDisabled) =>
  offers
    .map(
      (offer) => `
    <div class="event__offer-selector">
      <input class="event__offer-checkbox visually-hidden" id="event-offer-${offer.id}-${suffix}" type="checkbox" name="event-offer-${offer.id}" ${selectedOfferIds.includes(offer.id) ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
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

const getResetButtonLabel = (isCreating, isDeleting) => {
  if (isCreating) {
    return 'Cancel';
  }
  if (isDeleting) {
    return 'Deleting...';
  }

  return 'Delete';
};

const createEditPointTemplate = ({
  point,
  destination,
  destinations,
  availableOffers,
  isCreating,
  isDisabled,
  isSaving,
  isDeleting,
}) => {
  const safePoint = {
    id: point?.id ?? '',
    type: point?.type ?? 'flight',
    destinationName: escapeHTML(destination?.name ?? ''),
    dateFrom: point?.dateFrom ? dayjs(point.dateFrom).format('DD/MM/YY HH:mm') : '',
    dateTo: point?.dateTo ? dayjs(point.dateTo).format('DD/MM/YY HH:mm') : '',
    basePrice: escapeHTML(String(point?.basePrice ?? '')),
    offerIds: point?.offerIds ?? [],
  };

  const suffix = isCreating ? '' : `-${safePoint.id}`;
  const lowercaseSuffix = suffix.toLowerCase();

  return `
    <li class="trip-events__item">
      <form class="event  event--edit" action="#" method="post">
        <header class="event__header">
          <div class="event__type-wrapper">
            <label class="event__type  event__type-btn" for="event-type-toggle${lowercaseSuffix}">
              <span class="visually-hidden">Choose event type</span>
              <img class="event__type-icon" width="17" height="17" src="img/icons/${safePoint.type}.png" alt="Event type icon">
            </label>
            <input class="event__type-toggle  visually-hidden" id="event-type-toggle${lowercaseSuffix}" type="checkbox" ${isDisabled ? 'disabled' : ''}>

            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Event type</legend>
                ${createTypeItemsTemplate(safePoint.type, lowercaseSuffix, isDisabled)}
              </fieldset>
            </div>
          </div>

          <div class="event__field-group  event__field-group--destination">
            <label class="event__label  event__type-output" for="event-destination${lowercaseSuffix}">
              ${safePoint.type}
            </label>
            <input class="event__input  event__input--destination" id="event-destination${lowercaseSuffix}" type="text" name="event-destination" value="${safePoint.destinationName}" placeholder="Choose destination" list="destination-list${lowercaseSuffix}" ${isDisabled ? 'disabled' : ''}>
            <datalist id="destination-list${lowercaseSuffix}">
              ${createDestinationOptionsTemplate(destinations)}
            </datalist>
          </div>

          <div class="event__field-group  event__field-group--time">
            <label class="visually-hidden" for="event-start-time${lowercaseSuffix}">From</label>
            <input class="event__input  event__input--time" id="event-start-time${lowercaseSuffix}" type="text" name="event-start-time" value="${safePoint.dateFrom}" placeholder="Select start date and time" ${isDisabled ? 'disabled' : ''}>
            &mdash;
            <label class="visually-hidden" for="event-end-time${lowercaseSuffix}">To</label>
            <input class="event__input  event__input--time" id="event-end-time${lowercaseSuffix}" type="text" name="event-end-time" value="${safePoint.dateTo}" placeholder="Select end date and time" ${isDisabled ? 'disabled' : ''}>
          </div>

          <div class="event__field-group  event__field-group--price">
            <label class="event__label" for="event-price${lowercaseSuffix}">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input class="event__input  event__input--price" id="event-price${lowercaseSuffix}" type="number" name="event-price" value="${safePoint.basePrice}" placeholder="0" min="1" required ${isDisabled ? 'disabled' : ''}>
          </div>

          <button class="event__save-btn btn btn--blue" type="submit" ${isDisabled ? 'disabled' : ''}>${isSaving ? 'Saving...' : 'Save'}</button>
          <button class="event__reset-btn" type="reset">${getResetButtonLabel(isCreating, isDeleting)}</button>
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
          ${
  (availableOffers.length > 0) || (destination?.description) || (destination?.pictures && destination.pictures.length > 0)
    ? `
        <section class="event__details">
          ${
  availableOffers.length > 0
    ? `
          <section class="event__section event__section--offers">
            <h3 class="event__section-title event__section-title--offers">Offers</h3>
            <div class="event__available-offers">
              ${createOffersTemplate(availableOffers, safePoint.offerIds, lowercaseSuffix, isDisabled)}
            </div>
          </section>
          `
    : ''
}

          ${
  destination?.description || (destination?.pictures && destination.pictures.length > 0)
    ? `
          <section class="event__section event__section--destination">
            <h3 class="event__section-title event__section-title--destination">Destination</h3>
            <p class="event__destination-description">${escapeHTML(destination?.description ?? '')}</p>
            ${createPhotosTemplate(destination?.pictures ?? [])}
          </section>
          `
    : ''
}
        </section>
        `
    : ''
}
      </form>
    </li>
  `;
};

export default class EditPointView extends AbstractStatefulView {
  #point = null;
  #destinations = [];
  #destinationsById = null;
  #offers = [];
  #isCreating = false;
  #datepickerFrom = null;
  #datepickerTo = null;

  #handleFormSubmit = null;
  #handleCloseClick = null;
  #handleDeleteClick = null;

  constructor({
    point = null,
    destinations = [],
    destinationsById = new Map(),
    offers = [],
    onFormSubmit,
    onCloseClick,
    onDeleteClick
  } = {}) {
    super();
    this.#point = point;
    this.#destinations = destinations;
    this.#destinationsById = destinationsById;
    this.#offers = offers;
    this.#isCreating = point === null;
    this.#handleFormSubmit = onFormSubmit;
    this.#handleCloseClick = onCloseClick;
    this.#handleDeleteClick = onDeleteClick;

    this._setState({
      point: this.#point ?? {
        id: null,
        type: 'flight',
        destinationId: null,
        dateFrom: '',
        dateTo: '',
        basePrice: 0,
        offerIds: [],
      },
      currentDestinationId: this.#point?.destinationId ?? null,
      currentDestinationName: this.#point?.destinationId
        ? this.#destinationsById.get(this.#point.destinationId)?.name
        : '',
      currentType: this.#point?.type ?? 'flight',
      isDisabled: false,
      isSaving: false,
      isDeleting: false,
    });

    this._restoreHandlers();
  }

  get template() {
    const destination = this.#destinationsById.get(this._state.currentDestinationId);
    const pointType = this._state.currentType;
    const availableOffers = this.#offers.filter(
      (offer) => offer.type === pointType,
    );

    return createEditPointTemplate({
      point: this._state.point,
      destination,
      destinations: this.#destinations,
      availableOffers,
      isCreating: this.#isCreating,
      isDisabled: this._state.isDisabled,
      isSaving: this._state.isSaving,
      isDeleting: this._state.isDeleting,
    });
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

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    this.#handleFormSubmit(this._state.point);
  };

  #closeClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleCloseClick();
  };

  #deleteClickHandler = (evt) => {
    evt.preventDefault();
    if (this.#isCreating) {
      // For a new point, the button acts as "Cancel"
      this.#handleCloseClick();
    } else {
      // For an existing point, it acts as "Delete"
      this.#handleDeleteClick(this._state.point);
    }
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

  #offerChangeHandler = (evt) => {
    evt.preventDefault();
    const offerId = evt.target.name.replace('event-offer-', '');
    const isChecked = evt.target.checked;
    const currentOfferIds = [...this._state.point.offerIds];

    if (isChecked) {
      currentOfferIds.push(offerId);
    } else {
      const index = currentOfferIds.indexOf(offerId);
      if (index !== -1) {
        currentOfferIds.splice(index, 1);
      }
    }

    this._setState({
      point: {
        ...this._state.point,
        offerIds: currentOfferIds,
      },
    });
  };

  #destinationChangeHandler = (evt) => {
    evt.preventDefault();
    const selectedDestinationName = evt.target.value;
    const selectedDestination = this.#destinations.find(
      (dest) => dest.name === selectedDestinationName,
    );

    if (!selectedDestination) {
      evt.target.value = this._state.currentDestinationName;
      return;
    }

    if (selectedDestination) {
      this.updateElement({
        currentDestinationId: selectedDestination.id,
        currentDestinationName: selectedDestinationName,
        point: {
          ...this._state.point,
          destinationId: selectedDestination.id,
        },
      });
    }
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

  #dateFromChangeHandler = ([userDate]) => {
    this._setState({
      point: {
        ...this._state.point,
        dateFrom: userDate.toISOString(),
      },
    });
    this.#datepickerTo.set('minDate', this._state.point.dateFrom);
  };

  #dateToChangeHandler = ([userDate]) => {
    this._setState({
      point: {
        ...this._state.point,
        dateTo: userDate.toISOString(),
      },
    });
  };

  #setDatepickers() {
    const isCreating = this._state.point?.id === undefined || this._state.point?.id === null || this._state.point?.id === 'new';
    const suffix = isCreating ? '' : `-${this._state.point.id}`;
    const lowercaseSuffix = suffix.toLowerCase();
    const startInput = this.element.querySelector(`#event-start-time${lowercaseSuffix}`);
    const endInput = this.element.querySelector(`#event-end-time${lowercaseSuffix}`);

    if (this.#datepickerFrom) {
      this.#datepickerFrom.destroy();
    }
    if (this.#datepickerTo) {
      this.#datepickerTo.destroy();
    }

    this.#datepickerFrom = flatpickr(
      startInput,
      {
        dateFormat: 'd/m/y H:i',
        enableTime: true,
        'time_24hr': true,
        clickOpens: true,
        defaultDate: this._state.point.dateFrom,
        onChange: this.#dateFromChangeHandler,
      },
    );

    this.#datepickerTo = flatpickr(
      endInput,
      {
        dateFormat: 'd/m/y H:i',
        enableTime: true,
        'time_24hr': true,
        clickOpens: true,
        defaultDate: this._state.point.dateTo,
        minDate: this._state.point.dateFrom,
        onChange: this.#dateToChangeHandler,
      },
    );

    startInput.addEventListener('click', () => this.#datepickerFrom.open());
    startInput.addEventListener('focus', () => this.#datepickerFrom.open());
    endInput.addEventListener('click', () => this.#datepickerTo.open());
    endInput.addEventListener('focus', () => this.#datepickerTo.open());
  }

  _restoreHandlers() {
    const isCreating = this.#point === null || this.#point === undefined;
    const suffix = isCreating ? '' : `-${this.#point.id}`;
    const lowercaseSuffix = suffix.toLowerCase();

    this.element.querySelector('form').addEventListener('submit', this.#formSubmitHandler);
    this.element.querySelector('.event__reset-btn').addEventListener('click', this.#deleteClickHandler);

    this.element.querySelectorAll('.event__type-input').forEach((input) => {
      input.addEventListener('change', this.#typeChangeHandler);
    });

    this.element.querySelector(`#event-destination${lowercaseSuffix}`).addEventListener('change', this.#destinationChangeHandler);
    this.element.querySelector(`#event-price${lowercaseSuffix}`).addEventListener('change', this.#priceChangeHandler);

    this.element.querySelectorAll('.event__offer-checkbox').forEach((input) => {
      input.addEventListener('change', this.#offerChangeHandler);
    });

    if (!this.#isCreating) {
      this.element.querySelector('.event__rollup-btn')?.addEventListener('click', this.#closeClickHandler);
    }
    this.#setDatepickers();
  }
}
