import {render, replace, remove} from '../framework/render.js';
import PointView from '../view/point-view.js';
import EditPointView from '../view/edit-point-view.js';
import { UserAction, UpdateType } from '../const.js';
import { isEscKey } from '../utils/common.js';

export default class PointPresenter {
  #point = null;
  #destinations = [];
  #destinationsById = null;
  #offers = [];
  #offersById = null;
  #listContainer = null;

  #handleDataChange = null;
  #handleModeChange = null;

  #pointComponent = null;
  #pointEditComponent = null;
  #isEditing = false;

  constructor({
    point,
    destinations,
    destinationsById,
    offers,
    offersById,
    listContainer,
    onDataChange,
    onModeChange,
  }) {
    this.#point = point;
    this.#destinations = destinations;
    this.#destinationsById = destinationsById;
    this.#offers = offers;
    this.#offersById = offersById;
    this.#listContainer = listContainer;
    this.#handleDataChange = onDataChange;
    this.#handleModeChange = onModeChange;
  }

  init() {
    this.#pointComponent = this.#createPointComponent();
    this.#pointEditComponent = this.#createEditPointComponent();

    render(this.#pointComponent, this.#listContainer);
  }

  updatePoint(updatedPoint) {
    const previousPointComponent = this.#pointComponent;
    const previousPointEditComponent = this.#pointEditComponent;

    this.#point = updatedPoint;
    this.#pointComponent = this.#createPointComponent();
    this.#pointEditComponent = this.#createEditPointComponent();

    if (this.#isEditing) {
      replace(this.#pointEditComponent, previousPointEditComponent);
      return;
    }

    replace(this.#pointComponent, previousPointComponent);
  }

  resetView() {
    if (!this.#isEditing) {
      return;
    }

    this.#isEditing = false;
    document.removeEventListener('keydown', this.#escKeyDownHandler);
    replace(this.#pointComponent, this.#pointEditComponent);
  }

  destroy() {
    remove(this.#pointComponent);
    remove(this.#pointEditComponent);
    if (this.#isEditing) {
      document.removeEventListener('keydown', this.#escKeyDownHandler);
    }
  }

  #createPointComponent() {
    return new PointView({
      point: this.#point,
      destinationsById: this.#destinationsById,
      offersById: this.#offersById,
      onEditClick: this.#editClickHandler,
      onFavoriteClick: this.#favoriteClickHandler,
    });
  }

  #createEditPointComponent() {
    return new EditPointView({
      point: this.#point,
      destinations: this.#destinations,
      destinationsById: this.#destinationsById,
      offers: this.#offers,
      onFormSubmit: this.#formSubmitHandler,
      onCloseClick: this.#closeClickHandler,
    });
  }

  #switchToEditing = () => {
    this.#handleModeChange(this);
    this.#isEditing = true;
    replace(this.#pointEditComponent, this.#pointComponent);
    document.addEventListener('keydown', this.#escKeyDownHandler);
  };

  #editClickHandler = () => {
    this.#switchToEditing();
  };

  #formSubmitHandler = () => {
    this.resetView();
  };

  #closeClickHandler = () => {
    this.resetView();
  };

  #favoriteClickHandler = (updatedPoint) => {
    this.#handleDataChange(updatedPoint);
  };

  #escKeyDownHandler = (evt) => {
    if (!isEscKey(evt)) {
      return;
    }

    evt.preventDefault();
    this.resetView();
  };
}
