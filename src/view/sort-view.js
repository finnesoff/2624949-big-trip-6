import AbstractView from '../framework/view/abstract-view.js';

const SortType = {
  DAY: 'day',
  EVENT: 'event',
  TIME: 'time',
  PRICE: 'price',
  OFFER: 'offer'
};

function createSortItemTemplate(sortType, isChecked, isDisabled) {
  return (
    `<div class="trip-sort__item  trip-sort__item--${sortType}">
      <input
        id="sort-${sortType}"
        class="trip-sort__input  visually-hidden"
        type="radio"
        name="trip-sort"
        value="sort-${sortType}"
        ${isChecked ? 'checked' : ''}
        ${isDisabled ? 'disabled' : ''}
      >
      <label class="trip-sort__btn" for="sort-${sortType}">${sortType}</label>
    </div>`
  );
}

function createSortTemplate() {
  return (
    `<form class="trip-events__trip-sort  trip-sort" action="#" method="get">
      ${createSortItemTemplate(SortType.DAY, true, false)}
      ${createSortItemTemplate(SortType.EVENT, false, true)}
      ${createSortItemTemplate(SortType.TIME, false, false)}
      ${createSortItemTemplate(SortType.PRICE, false, false)}
      ${createSortItemTemplate(SortType.OFFER, false, true)}
    </form>`
  );
}

export default class SortView extends AbstractView {
  get template() {
    return createSortTemplate();
  }
}
