import AbstractView from '../framework/view/abstract-view.js';
import { SortType } from '../const.js';

function createSortItemTemplate(sortType, isChecked, isDisabled) {
  return (
    `<div class="trip-sort__item  trip-sort__item--${sortType}">
      <input
        id="sort-${sortType}"
        class="trip-sort__input  visually-hidden"
        type="radio"
        name="trip-sort"
        value="sort-${sortType}"
        data-sort-type="${sortType}"
        ${isChecked ? 'checked' : ''}
        ${isDisabled ? 'disabled' : ''}
      >
      <label class="trip-sort__btn" for="sort-${sortType}">${sortType}</label>
    </div>`
  );
}

function createSortTemplate(currentSortType) {
  return (
    `<form class="trip-events__trip-sort  trip-sort" action="#" method="get">
      ${createSortItemTemplate(SortType.DAY, currentSortType === SortType.DAY, false)}
      ${createSortItemTemplate(SortType.EVENT, currentSortType === SortType.EVENT, true)}
      ${createSortItemTemplate(SortType.TIME, currentSortType === SortType.TIME, false)}
      ${createSortItemTemplate(SortType.PRICE, currentSortType === SortType.PRICE, false)}
      ${createSortItemTemplate(SortType.OFFER, currentSortType === SortType.OFFER, true)}
    </form>`
  );
}

export default class SortView extends AbstractView {
  #onSortTypeChange = null;
  #currentSortType = null;

  constructor({ onSortTypeChange, currentSortType }) {
    super();
    this.#onSortTypeChange = onSortTypeChange;
    this.#currentSortType = currentSortType;
    this.element.addEventListener('change', this.#handleSortTypeChange);
  }

  get template() {
    return createSortTemplate(this.#currentSortType);
  }

  #handleSortTypeChange = (evt) => {
    const sortType = evt.target.dataset.sortType;
    this.#onSortTypeChange(sortType);
  };
}

