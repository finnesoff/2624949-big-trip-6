import {render, replace} from '../framework/render.js';
import FiltersView from '../view/filters-view.js';
import SortView from '../view/sort-view.js';
import ListView from '../view/list-view.js';
import PointView from '../view/point-view.js';
import EditPointView from '../view/edit-point-view.js';
import ListEmptyView from '../view/list-empty-view.js';
import { generateFilter } from '../mock/filter.js';

export default class TripPresenter {
  #filtersContainer = null;
  #tripEventsContainer = null;
  #pointsModel = null;

  #listComponent = new ListView();
  #sortComponent = new SortView();
  #listEmptyComponent = new ListEmptyView();

  constructor({ filtersContainer, tripEventsContainer, pointsModel }) {
    this.#filtersContainer = filtersContainer;
    this.#tripEventsContainer = tripEventsContainer;
    this.#pointsModel = pointsModel;
  }

  init() {
    const points = this.#pointsModel.points;
    const destinations = this.#pointsModel.destinations;
    const offers = this.#pointsModel.offers;
    const destinationsById = new Map(
      destinations.map((destination) => [destination.id, destination]),
    );
    const offersById = new Map(offers.map((offer) => [offer.id, offer]));

    const filters = generateFilter(points);
    const filtersComponent = new FiltersView({ filters });

    render(filtersComponent, this.#filtersContainer);

    if (points.length === 0) {
      render(this.#listEmptyComponent, this.#tripEventsContainer);
      return;
    }

    render(this.#sortComponent, this.#tripEventsContainer);
    render(this.#listComponent, this.#tripEventsContainer);

    for (const point of points) {
      this.#renderPoint(point, destinations, destinationsById, offers, offersById);
    }
  }

  #renderPoint(point, destinations, destinationsById, offers, offersById) {
    const escKeyDownHandler = (evt) => {
      if (evt.key === 'Escape') {
        evt.preventDefault();
        replaceFormToCard();
        document.removeEventListener('keydown', escKeyDownHandler);
      }
    };

    const pointComponent = new PointView({
      point,
      destinationsById,
      offersById,
      onEditClick: () => {
        replaceCardToForm();
        document.addEventListener('keydown', escKeyDownHandler);
      }
    });

    const pointEditComponent = new EditPointView({
      point,
      destinations,
      destinationsById,
      offers,
      onFormSubmit: () => {
        replaceFormToCard();
        document.removeEventListener('keydown', escKeyDownHandler);
      },
      onCloseClick: () => {
        replaceFormToCard();
        document.removeEventListener('keydown', escKeyDownHandler);
      }
    });

    function replaceCardToForm() {
      replace(pointEditComponent, pointComponent);
    }

    function replaceFormToCard() {
      replace(pointComponent, pointEditComponent);
    }

    render(pointComponent, this.#listComponent.element);
  }
}
