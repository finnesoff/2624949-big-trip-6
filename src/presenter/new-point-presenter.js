import { render, remove, RenderPosition } from '../framework/render.js';
import EditPointView from '../view/edit-point-view.js';
import { UserAction, UpdateType } from '../const.js';
import { isEscKey } from '../utils/common.js';

export default class NewPointPresenter {
  #listContainer = null;
  #handleDataChange = null;
  #handleDestroy = null;

  #editPointComponent = null;

  #destinations = [];
  #destinationsById = new Map();
  #offers = [];

  constructor({ listContainer, onDataChange, onDestroy }) {
    this.#listContainer = listContainer;
    this.#handleDataChange = onDataChange;
    this.#handleDestroy = onDestroy;
  }

  init(destinations, destinationsById, offers) {
    if (this.#editPointComponent !== null) {
      return;
    }

    this.#destinations = destinations;
    this.#destinationsById = destinationsById;
    this.#offers = offers;

    this.#editPointComponent = new EditPointView({
      destinations: this.#destinations,
      destinationsById: this.#destinationsById,
      offers: this.#offers,
      onFormSubmit: this.#handleFormSubmit,
      onCloseClick: this.#handleCloseClick,
    });

    render(this.#editPointComponent, this.#listContainer, RenderPosition.AFTERBEGIN);

    document.addEventListener('keydown', this.#escKeyDownHandler);
  }

  destroy() {
    if (this.#editPointComponent === null) {
      return;
    }

    this.#handleDestroy();

    remove(this.#editPointComponent);
    this.#editPointComponent = null;

    document.removeEventListener('keydown', this.#escKeyDownHandler);
  }

  setSaving() {
    this.#editPointComponent.updateElement({
      isDisabled: true,
      isSaving: true,
    });
  }

  setAborting() {
    const resetFormState = () => {
      this.#editPointComponent.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false,
      });
    };

    this.#editPointComponent.shake(resetFormState);
  }

  #handleFormSubmit = (point) => {
    this.#handleDataChange(
      UserAction.ADD_POINT,
      UpdateType.MINOR,
      point,
    );
  };

  #handleCloseClick = () => {
    this.destroy();
  };

  #escKeyDownHandler = (evt) => {
    if (isEscKey(evt)) {
      evt.preventDefault();
      this.destroy();
    }
  };
}
