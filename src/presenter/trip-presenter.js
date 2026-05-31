import {render} from '../framework/render.js';
import FiltersView from '../view/filters-view.js';
import SortView, { SortType } from '../view/sort-view.js';
import ListView from '../view/list-view.js';
import ListEmptyView from '../view/list-empty-view.js';
import PointPresenter from './point-presenter.js';
import NewPointPresenter from './new-point-presenter.js';
import TripInfoView from '../view/trip-info-view.js';
import { filter } from '../utils/filter.js';
import { sortPointDay, sortPointTime, sortPointPrice } from '../utils/sort.js';
import { SortType, UpdateType, UserAction } from '../const.js';
import UiBlocker from '../framework/ui-blocker/ui-blocker.js';

const TimeLimit = {
  LOWER_LIMIT: 350,
  UPPER_LIMIT: 1000,
};

export default class TripPresenter {
  #tripEventsContainer = null;
  #pointsModel = null;
  #filterModel = null;

  #listComponent = new ListView();
  #sortComponent = null;
  #listEmptyComponent = new ListEmptyView();
  #pointPresenters = new Map();
  #currentSortType = DEFAULT_SORT_TYPE;

  #destinations = null;
  #destinationsById = null;
  #offers = null;
  #offersById = null;

  constructor({ tripEventsContainer, pointsModel, filterModel, onNewPointDestroy }) {
    this.#tripEventsContainer = tripEventsContainer;
    this.#pointsModel = pointsModel;
    this.#filterModel = filterModel;
    this.#headerContainer = document.querySelector('.trip-main');

    this.#newPointPresenter = new NewPointPresenter({
      listContainer: this.#listComponent.element,
      onDataChange: this.#handleViewAction,
      onDestroy: onNewPointDestroy
    });

    this.#pointsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
  }

  get points() {
    const filterType = this.#filterModel.filter;
    const points = this.#pointsModel.points;
    const filteredPoints = filter[filterType](points);

    const pointsCopy = Array.isArray(filteredPoints) ? [...filteredPoints] : [];

    switch (this.#currentSortType) {
      case SortType.DAY:
        return pointsCopy.sort(sortPointDay);
      case SortType.TIME:
        return pointsCopy.sort(sortPointTime);
      case SortType.PRICE:
        return pointsCopy.sort(sortPointPrice);
    }

    return pointsCopy;
  }

  get destinations() {
    return this.#pointsModel.destinations;
  }

  get offers() {
    return this.#pointsModel.offers;
  }

  init() {
    this.#renderBoard();
  }

  createPoint() {
    const points = this.points;
    if (points.length === 0) {
      if (this.#listEmptyComponent) {
        remove(this.#listEmptyComponent);
        this.#listEmptyComponent = null;
      }
      if (!this.#isError) {
        this.#renderSort();
      }
      render(this.#listComponent, this.#tripEventsContainer);
    }

    this.#newPointPresenter.init(this.destinations, new Map(this.destinations.map((d) => [d.id, d])), this.offers);
  }

    const filtersComponent = new FiltersView();

    render(filtersComponent, this.#filtersContainer);

    if (points.length === 0) {
      render(new ListEmptyView(), this.#tripEventsContainer);
      return;
    }

    this.#sortComponent = new SortView({
      onSortTypeChange: this.#handleSortTypeChange,
    });

    render(this.#sortComponent, this.#tripEventsContainer);
    render(this.#listComponent, this.#tripEventsContainer);

    this.#renderPoints(points);
  }

  #renderPoints(points) {
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();

    const sortedPoints = [...points].sort(SortFunctionMap[this.#currentSortType]);

    for (const point of sortedPoints) {
      const pointPresenter = new PointPresenter({
        point,
        destinations: this.#destinations,
        destinationsById: this.#destinationsById,
        offers: this.#offers,
        offersById: this.#offersById,
        listContainer: this.#listComponent.element,
        onDataChange: this.#handlePointChange,
        onModeChange: this.#handlePointModeChange,
      });

      this.#pointPresenters.set(point.id, pointPresenter);
      pointPresenter.init();
    }
  }

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;
    this.#renderPoints(this.#pointsModel.points);
  };

  #handlePointChange = (updatedPoint) => {
    const pointIndex = this.#pointsModel.points.findIndex((point) => point.id === updatedPoint.id);

    if (pointIndex === -1) {
      return;
    }

    this.#tripInfoComponent = new TripInfoView({
      points: this.#pointsModel.points,
      destinations: this.destinations,
      offers: this.offers
    });
    render(this.#tripInfoComponent, this.#headerContainer, RenderPosition.AFTERBEGIN);
  }

  #clearTripInfo() {
    if (this.#tripInfoComponent) {
      remove(this.#tripInfoComponent);
      this.#tripInfoComponent = null;
    }
  }

  #handlePointModeChange = (activePointPresenter) => {
    this.#pointPresenters.forEach((pointPresenter) => {
      if (pointPresenter !== activePointPresenter) {
        pointPresenter.resetView();
      }
    });
  };
}
