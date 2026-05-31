import AbstractView from '../framework/view/abstract-view.js';
import dayjs from 'dayjs';
import { escapeHTML } from '../utils/common.js';

const MAX_ROUTE_NAMES = 3;
const DATE_FORMAT_SHORT = 'D MMM';

const formatDateShort = (date) => dayjs(date).format(DATE_FORMAT_SHORT).toUpperCase();

const createTitle = (points, destinationsById) => {
  if (!points || points.length === 0) {
    return '';
  }

  const sorted = [...points].sort((a, b) => a.dateFrom - b.dateFrom);
  const names = sorted.map((p) => destinationsById.get(p.destinationId)?.name || '').filter(Boolean);
  const unique = names.filter((v, i, arr) => arr.indexOf(v) === i);
  const safeNames = unique.map((name) => escapeHTML(name));

  if (unique.length === 0) {
    return '';
  }

  if (safeNames.length <= MAX_ROUTE_NAMES) {
    return safeNames.join(' &mdash; ');
  }

  return `${safeNames[0]} &mdash; ... &mdash; ${safeNames[safeNames.length - 1]}`;
};

const createDates = (points) => {
  if (!points || points.length === 0) {
    return '';
  }

  const from = new Date(Math.min(...points.map((p) => p.dateFrom instanceof Date ? p.dateFrom.getTime() : new Date(p.dateFrom).getTime())));
  const to = new Date(Math.max(...points.map((p) => p.dateTo instanceof Date ? p.dateTo.getTime() : new Date(p.dateTo).getTime())));

  return `${formatDateShort(from)} &mdash; ${formatDateShort(to)}`;
};

const createTotal = (points, offersById) => {
  if (!points || points.length === 0) {
    return '';
  }

  let total = 0;
  for (const p of points) {
    total += Number(p.basePrice) || 0;
    if (Array.isArray(p.offerIds)) {
      for (const id of p.offerIds) {
        const offer = offersById.get(id);
        if (offer) {
          total += Number(offer.price) || 0;
        }
      }
    }
  }

  return String(total);
};

const createTemplate = (points, destinations, offers) => {
  const destinationsById = new Map(destinations.map((d) => [d.id, d]));
  const offersById = new Map((offers || []).map((o) => [o.id, o]));

  const title = createTitle(points, destinationsById);
  const dates = createDates(points);
  const total = createTotal(points, offersById);

  return `
    <section class="trip-main__trip-info  trip-info">
      <div class="trip-info__main">
        <h1 class="trip-info__title">${title}</h1>
        <p class="trip-info__dates">${dates}</p>
      </div>
      <p class="trip-info__cost">Total: &euro;&nbsp;<span class="trip-info__cost-value">${total}</span></p>
    </section>
  `;
};

export default class TripInfoView extends AbstractView {
  #points = null;
  #destinations = null;
  #offers = null;

  constructor({ points = [], destinations = [], offers = [] } = {}) {
    super();
    this.#points = points;
    this.#destinations = destinations;
    this.#offers = offers;
  }

  get template() {
    return createTemplate(this.#points, this.#destinations, this.#offers);
  }

  update({ points, destinations, offers }) {
    this.#points = points ?? this.#points;
    this.#destinations = destinations ?? this.#destinations;
    this.#offers = offers ?? this.#offers;
    this.removeElement();
  }
}
