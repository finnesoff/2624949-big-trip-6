import { render, remove, RenderPosition } from '../framework/render.js';
import NewPointView from '../view/new-point-view.js';
import { UserAction, UpdateType } from '../const.js';
import { isEscKey } from '../utils/common.js';

export default class NewPointPresenter {
  #listContainer = null;
  #handleDataChange = null;
  #handleDestroy = null;

  #newPointComponent = null;

  #destinations = [];
  #destinationsById = new Map();
  #offers = [];

  constructor({ listContainer, onDataChange, onDestroy }) {
    this.#listContainer = listContainer;
    this.#handleDataChange = onDataChange;
    this.#handleDestroy = onDestroy;
  }

  init(destinations, destinationsById, offers) {
    if (this.#newPointComponent !== null) {
      return;
    }

    this.#destinations = destinations;
    this.#destinationsById = destinationsById;
    this.#offers = offers;

    this.#newPointComponent = new NewPointView({
      destinations: this.#destinations,
      destinationsById: this.#destinationsById,
      offers: this.#offers,
      onFormSubmit: this.#handleFormSubmit,
      onCloseClick: this.#handleCloseClick,
    });

    render(this.#newPointComponent, this.#listContainer, RenderPosition.AFTERBEGIN);

    document.addEventListener('keydown', this.#escKeyDownHandler);
  }

  destroy({ notify = true } = {}) {
    if (this.#newPointComponent === null) {
      return;
    }

    if (notify) {
      this.#handleDestroy();
    }

    remove(this.#newPointComponent);
    this.#newPointComponent = null;

    document.removeEventListener('keydown', this.#escKeyDownHandler);
  }

  setSaving() {
    this.#newPointComponent.updateElement({
      isDisabled: true,
      isSaving: true,
    });
  }

  setAborting() {
    const resetFormState = () => {
      if (this.#newPointComponent === null) {
        return;
      }
      this.#newPointComponent.updateElement({
        isDisabled: false,
        isSaving: false,
      });
    };

    if (this.#newPointComponent === null) {
      return;
    }
    this.#newPointComponent.shake(resetFormState);
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
