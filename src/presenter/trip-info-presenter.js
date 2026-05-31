import { render, replace, remove, RenderPosition } from '../framework/render.js';
import TripInfoView from '../view/trip-info-view.js';
import dayjs from 'dayjs';

const MAX_ROUTE_ITEMS = 3;
const DATE_FORMAT_DAY = 'D';
const DATE_FORMAT_DAY_MONTH = 'D MMM';

export default class TripInfoPresenter {
  #tripInfoContainer = null;
  #pointsModel = null;
  #tripInfoComponent = null;

  constructor({ tripInfoContainer, pointsModel }) {
    this.#tripInfoContainer = tripInfoContainer;
    this.#pointsModel = pointsModel;

    this.#pointsModel.addObserver(this.#handleModelEvent);
  }

  init() {
    if (this.#pointsModel.points.length === 0) {
      if (this.#tripInfoComponent) {
        remove(this.#tripInfoComponent);
        this.#tripInfoComponent = null;
      }
      return;
    }

    const route = this.#calculateRoute();
    const dates = this.#calculateDates();
    const price = this.#calculatePrice();

    const prevTripInfoComponent = this.#tripInfoComponent;

    this.#tripInfoComponent = new TripInfoView({ route, dates, price });

    if (prevTripInfoComponent === null) {
      render(this.#tripInfoComponent, this.#tripInfoContainer, RenderPosition.AFTERBEGIN);
      return;
    }

    replace(this.#tripInfoComponent, prevTripInfoComponent);
    remove(prevTripInfoComponent);
  }

  #handleModelEvent = () => {
    this.init();
  };

  #calculateRoute() {
    const points = [...this.#pointsModel.points].sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom));
    const destinations = points.map((point) => {
      const dest = this.#pointsModel.destinations.find((d) => d.id === point.destinationId);
      return dest ? dest.name : '';
    }).filter(Boolean);

    const tripRoute = destinations.filter((dest, index, arr) => dest !== arr[index - 1]);

    if (tripRoute.length === 0) {
      return '';
    }

    if (tripRoute.length > MAX_ROUTE_ITEMS) {
      return `${tripRoute[0]} &mdash; ... &mdash; ${tripRoute[tripRoute.length - 1]}`;
    }

    return tripRoute.join(' &mdash; ');
  }

  #calculateDates() {
    const points = [...this.#pointsModel.points].sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom));
    if (points.length === 0) {
      return '';
    }

    const startDate = dayjs(points[0].dateFrom);
    const endDate = dayjs(points[points.length - 1].dateTo);

    if (startDate.isSame(endDate, 'month')) {
      return `${startDate.format(DATE_FORMAT_DAY)}&nbsp;&mdash;&nbsp;${endDate.format(DATE_FORMAT_DAY_MONTH)}`;
    }

    return `${startDate.format(DATE_FORMAT_DAY_MONTH)}&nbsp;&mdash;&nbsp;${endDate.format(DATE_FORMAT_DAY_MONTH)}`;
  }

  #calculatePrice() {
    return this.#pointsModel.points.reduce((total, point) => {
      let price = total + point.basePrice;

      const offerGroup = this.#pointsModel.offers.find((offer) => offer.type === point.type);
      if (offerGroup) {
        point.offerIds.forEach((offerId) => {
          const offer = offerGroup.offers.find((o) => o.id === offerId);
          if (offer) {
            price += offer.price;
          }
        });
      }

      return price;
    }, 0);
  }
}
