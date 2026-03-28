import View from "./view";

function createListTemplate() {
  return '<ul class="trip-events__list"></ul>';
}

export default class ListView extends View {
  get template() {
    return createListTemplate();
  }
}
