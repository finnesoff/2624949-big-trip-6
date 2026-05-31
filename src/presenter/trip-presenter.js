import {render, remove, RenderPosition} from '../framework/render.js';
import SortView from '../view/sort-view.js';
import ListView from '../view/list-view.js';
import ListEmptyView from '../view/list-empty-view.js';
import LoadingView from '../view/loading-view.js';
import FailedLoadView from '../view/failed-load-view.js';
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
  #tripInfoComponent = null;
  #headerContainer = null;
  #sortComponent = null;
  #listEmptyComponent = null;
  #loadingComponent = new LoadingView();
  #failedLoadComponent = new FailedLoadView();
  #pointPresenters = new Map();
  #newPointPresenter = null;
  #currentSortType = SortType.DAY;
  #isLoading = true;
  #isError = false;
  #uiBlocker = new UiBlocker({
    lowerLimit: TimeLimit.LOWER_LIMIT,
    upperLimit: TimeLimit.UPPER_LIMIT
  });

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

  #handleViewAction = async (actionType, updateType, update) => {
    this.#uiBlocker.block();

    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#pointPresenters.get(update.id).setSaving();
        try {
          await this.#pointsModel.updatePoint(updateType, update);
        } catch(err) {
          this.#pointPresenters.get(update.id).setAborting();
        }
        break;
      case UserAction.ADD_POINT:
        this.#newPointPresenter.setSaving();
        try {
          await this.#pointsModel.addPoint(updateType, update);
        } catch(err) {
          this.#newPointPresenter.setAborting();
        }
        break;
      case UserAction.DELETE_POINT:
        this.#pointPresenters.get(update.id).setDeleting();
        try {
          await this.#pointsModel.deletePoint(updateType, update);
        } catch(err) {
          this.#pointPresenters.get(update.id).setAborting();
        }
        break;
    }

    this.#uiBlocker.unblock();
  };

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#pointPresenters.get(data.id)?.updatePoint(data);
        break;
      case UpdateType.MINOR:
        this.#clearBoard();
        this.#renderBoard();
        break;
      case UpdateType.MAJOR:
        this.#clearBoard({ resetSortType: true });
        this.#renderBoard();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.#clearBoard();
        this.#renderBoard();
        break;
      case UpdateType.ERROR:
        this.#isLoading = false;
        this.#isError = true;
        remove(this.#loadingComponent);
        this.#clearBoard();
        this.#renderBoard();
        break;
    }
  };

  #handlePointModeChange = (activePointPresenter) => {
    this.#newPointPresenter.destroy();
    this.#pointPresenters.forEach((pointPresenter) => {
      if (pointPresenter !== activePointPresenter) {
        pointPresenter.resetView();
      }
    });
  };

  #renderPoint(point) {
    const destinationsById = new Map(this.destinations.map((destination) => [destination.id, destination]));
    const offersById = new Map(this.offers.map((offer) => [offer.id, offer]));

    const pointPresenter = new PointPresenter({
      point,
      destinations: this.destinations,
      destinationsById,
      offers: this.offers,
      offersById,
      listContainer: this.#listComponent.element,
      onDataChange: this.#handleViewAction,
      onModeChange: this.#handlePointModeChange,
    });

    this.#pointPresenters.set(point.id, pointPresenter);
    pointPresenter.init();
  }

  #clearBoard({ resetSortType = false } = {}) {
    this.#newPointPresenter.destroy();
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();

    this.#clearTripInfo();

    if (this.#sortComponent) {
      remove(this.#sortComponent);
    }

    if (this.#listEmptyComponent) {
      remove(this.#listEmptyComponent);
    }

    remove(this.#loadingComponent);

    if (resetSortType) {
      this.#currentSortType = SortType.DAY;
    }
  }

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;
    this.#clearBoard();
    this.#renderBoard();
  };

  #renderSort() {
    this.#sortComponent = new SortView({
      currentSortType: this.#currentSortType,
      onSortTypeChange: this.#handleSortTypeChange
    });
    render(this.#sortComponent, this.#tripEventsContainer);
  }

  #renderTripInfo() {
    if (!this.#headerContainer) {
      return;
    }
    if (this.#tripInfoComponent) {
      remove(this.#tripInfoComponent);
      this.#tripInfoComponent = null;
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

  #renderListEmpty() {
    this.#listEmptyComponent = new ListEmptyView({
      filterType: this.#filterModel.filter
    });
    render(this.#listEmptyComponent, this.#tripEventsContainer);
  }

  #renderLoading() {
    render(this.#loadingComponent, this.#tripEventsContainer, RenderPosition.AFTERBEGIN);
  }

  #renderBoard() {
    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }
    if (this.#isError) {
      render(this.#failedLoadComponent, this.#tripEventsContainer);
      return;
    }

    const points = this.points;
    const allPoints = this.#pointsModel.points;

    if (allPoints.length > 0) {
      this.#renderTripInfo();
    } else {
      this.#clearTripInfo();
    }

    if (points.length === 0) {
      this.#renderListEmpty();
      return;
    }

    this.#renderSort();
    render(this.#listComponent, this.#tripEventsContainer);
    points.forEach((point) => this.#renderPoint(point));
  }
}
