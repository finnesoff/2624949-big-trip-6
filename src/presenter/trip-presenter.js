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
import { SortType, UpdateType, UserAction, DEFAULT_SORT_TYPE, FilterType } from '../const.js';
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
  #listEmptyComponent = null;
  #loadingComponent = new LoadingView();
  #failedLoadComponent = new FailedLoadView();
  #pointPresenters = new Map();
  #currentSortType = DEFAULT_SORT_TYPE;

  #destinations = null;
  #destinationsById = null;
  #offers = null;
  #offersById = null;
  #headerContainer = null;
  #tripInfoComponent = null;
  #newPointPresenter = null;
  #isLoading = true;
  #isError = false;

  constructor({ tripEventsContainer, pointsModel, filterModel, onNewPointDestroy }) {
    this.#tripEventsContainer = tripEventsContainer;
    this.#pointsModel = pointsModel;
    this.#filterModel = filterModel;
    this.#headerContainer = document.querySelector('.trip-main');

    this.#newPointPresenter = new NewPointPresenter({
      listContainer: this.#listComponent.element,
      onDataChange: this.#handleViewAction,
      onDestroy: () => {
        onNewPointDestroy();
        this.#renderBoard();
      }
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
    this.#currentSortType = DEFAULT_SORT_TYPE;
    this.#filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
    this.#handlePointModeChange();
    if (this.#listEmptyComponent) {
      remove(this.#listEmptyComponent);
      this.#listEmptyComponent = null;
    }
    // Ensure the list container is rendered so the new-point form can mount into it
    render(this.#listComponent, this.#tripEventsContainer);
    this.#newPointPresenter.init(this.destinations, new Map(this.destinations.map((d) => [d.id, d])), this.offers);
  }

  #renderBoard() {
    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    if (this.#isError) {
      this.#renderFailedLoad();
      return;
    }

    const points = this.points;
    const pointsCount = points.length;

    const isEverythingFilter = this.#filterModel.filter === FilterType.EVERYTHING;
    if (this.#pointsModel.points.length === 0 && isEverythingFilter) {
      this.#renderListEmpty();
      return;
    }

    this.#destinations = this.#pointsModel.destinations;
    this.#destinationsById = new Map(this.#destinations.map((d) => [d.id, d]));
    this.#offers = this.#pointsModel.offers;
    this.#offersById = new Map(this.#offers.map((o) => [o.id, o]));

    if (pointsCount === 0) {
      this.#renderListEmpty();
      return;
    }

    this.#renderTripInfo();
    this.#renderSort();
    render(this.#listComponent, this.#tripEventsContainer);

    this.#renderPoints(points);
  }

  #renderTripInfo() {
    this.#tripInfoComponent = new TripInfoView({
      points: this.#pointsModel.points,
      destinations: this.destinations,
      offers: this.offers
    });
    render(this.#tripInfoComponent, this.#headerContainer, RenderPosition.AFTERBEGIN);
  }

  #renderListEmpty() {
    this.#listEmptyComponent = new ListEmptyView({
      filterType: this.#filterModel.filter
    });

    render(this.#listEmptyComponent, this.#tripEventsContainer);
  }

  #renderLoading() {
    render(this.#loadingComponent, this.#tripEventsContainer);
  }

  #renderFailedLoad() {
    render(this.#failedLoadComponent, this.#tripEventsContainer);
  }

  #renderPoints(points) {
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();

    for (const point of points) {
      const pointPresenter = new PointPresenter({
        point,
        destinations: this.#destinations,
        destinationsById: this.#destinationsById,
        offers: this.#offers,
        offersById: this.#offersById,
        listContainer: this.#listComponent.element,
        onDataChange: this.#handleViewAction,
        onModeChange: this.#handlePointModeChange,
      });

      this.#pointPresenters.set(point.id, pointPresenter);
      pointPresenter.init();
    }
  }

  #handleViewAction = async (actionType, updateType, update) => {
    const uiBlocker = new UiBlocker({
      lowerLimit: TimeLimit.LOWER_LIMIT,
      upperLimit: TimeLimit.UPPER_LIMIT
    });
    uiBlocker.block();

    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#pointPresenters.get(update.id).setSaving();
        try {
          await this.#pointsModel.updatePoint(updateType, update);
        } catch (err) {
          const presenter = this.#pointPresenters.get(update.id);
          if (presenter) {
            presenter.setAborting();
          }
        }
        break;
      case UserAction.ADD_POINT:
        this.#newPointPresenter.setSaving();
        try {
          await this.#pointsModel.addPoint(updateType, update);
        } catch (err) {
          this.#newPointPresenter.setAborting();
        }
        break;
      case UserAction.DELETE_POINT:
        this.#pointPresenters.get(update.id).setDeleting();
        try {
          await this.#pointsModel.deletePoint(updateType, update);
        } catch (err) {
          const presenter = this.#pointPresenters.get(update.id);
          if (presenter) {
            presenter.setAborting();
          }
        }
        break;
    }

    uiBlocker.unblock();
  };

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#pointPresenters.get(data.id).init(data);
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
        this.#renderBoard();
        break;
      case UpdateType.ERROR:
        this.#isLoading = false;
        this.#isError = true;
        remove(this.#loadingComponent);
        this.#renderBoard();
        break;
    }
  };

  #renderSort() {
    this.#sortComponent = new SortView({
      onSortTypeChange: this.#handleSortTypeChange,
      currentSortType: this.#currentSortType,
    });

    render(this.#sortComponent, this.#tripEventsContainer);
  }

  #clearBoard({ resetSortType = false } = {}) {
    this.#newPointPresenter.destroy({ notify: false });
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();

    remove(this.#sortComponent);
    remove(this.#listEmptyComponent);
    remove(this.#loadingComponent);
    remove(this.#failedLoadComponent);
    this.#clearTripInfo();

    if (resetSortType) {
      this.#currentSortType = DEFAULT_SORT_TYPE;
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

  #clearTripInfo() {
    if (this.#tripInfoComponent) {
      remove(this.#tripInfoComponent);
      this.#tripInfoComponent = null;
    }
  }

  #handlePointModeChange = (activePointPresenter) => {
    this.#newPointPresenter.destroy({ notify: false });
    this.#pointPresenters.forEach((pointPresenter) => {
      if (pointPresenter !== activePointPresenter) {
        pointPresenter.resetView();
      }
    });
  };
}
