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

  init(point = this.#point) {
    const previousPointComponent = this.#pointComponent;
    const previousPointEditComponent = this.#pointEditComponent;

    this.#point = point;
    this.#pointComponent = this.#createPointComponent();
    this.#pointEditComponent = this.#createEditPointComponent();

    if (previousPointComponent === null || previousPointEditComponent === null) {
      render(this.#pointComponent, this.#listContainer);
      return;
    }

    if (this.#isEditing) {
      replace(this.#pointEditComponent, previousPointEditComponent);
    } else {
      replace(this.#pointComponent, previousPointComponent);
    }

    remove(previousPointComponent);
    remove(previousPointEditComponent);
  }

  updatePoint(updatedPoint) {
    this.init(updatedPoint);
  }

  destroy() {
    remove(this.#pointComponent);
    remove(this.#pointEditComponent);
  }

  setSaving() {
    if (this.#isEditing) {
      this.#pointEditComponent.updateElement({
        isDisabled: true,
        isSaving: true,
      });
    }
  }

  setDeleting() {
    if (this.#isEditing) {
      this.#pointEditComponent.updateElement({
        isDisabled: true,
        isDeleting: true,
      });
    }
  }

  setAborting() {
    if (!this.#isEditing) {
      if (this.#pointComponent) {
        this.#pointComponent.shake();
      }
      return;
    }

    const resetFormState = () => {
      if (this.#pointEditComponent) {
        this.#pointEditComponent.updateElement({
          isDisabled: false,
          isSaving: false,
          isDeleting: false,
        });
      }
    };

    if (this.#pointEditComponent) {
      this.#pointEditComponent.shake(resetFormState);
    }
  }

  resetView() {
    if (!this.#isEditing) {
      return;
    }

    this.#isEditing = false;
    document.removeEventListener('keydown', this.#escKeyDownHandler);
    try {
      replace(this.#pointComponent, this.#pointEditComponent);
    } catch (err) {
      // Fallback: if replace fails, render point component into the list container
      render(this.#pointComponent, this.#listContainer);
      remove(this.#pointEditComponent);
    }
    // Recreate edit component to discard unsaved changes
    this.#pointEditComponent = this.#createEditPointComponent();
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
      onDeleteClick: this.#deleteClickHandler,
    });
  }

  #switchToEditing = () => {
    this.#handleModeChange(this);
    this.#isEditing = true;
    try {
      replace(this.#pointEditComponent, this.#pointComponent);
    } catch (err) {
      // Fallback: if replace fails (parent missing), render edit component into list container
      render(this.#pointEditComponent, this.#listContainer);
      remove(this.#pointComponent);
    }
    document.addEventListener('keydown', this.#escKeyDownHandler);
  };

  #editClickHandler = () => {
    this.#switchToEditing();
  };

  #formSubmitHandler = (updatedPoint) => {
    this.#handleDataChange(
      UserAction.UPDATE_POINT,
      UpdateType.MINOR,
      updatedPoint,
    );
  };

  #deleteClickHandler = (point) => {
    this.#handleDataChange(
      UserAction.DELETE_POINT,
      UpdateType.MINOR,
      point,
    );
  };

  #closeClickHandler = () => {
    this.resetView();
  };

  #favoriteClickHandler = async (updatedPoint) => {
    try {
      await this.#handleDataChange(
        UserAction.UPDATE_POINT,
        UpdateType.PATCH,
        updatedPoint,
      );
    } catch (err) {
      this.#pointComponent.shake();
    }
  };

  #escKeyDownHandler = (evt) => {
    if (!isEscKey(evt)) {
      return;
    }

    evt.preventDefault();
    this.resetView();
  };
}
