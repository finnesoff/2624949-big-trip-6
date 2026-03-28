import View from "./view";

function createNewPointTemplate() {
  return `
    <li class="trip-events__item">
      <form class="event event--edit" action="#" method="post">
        <header class="event__header">
          <div class="event__type-wrapper">
            <label class="event__type event__type-btn" for="event-type-toggle-new">
              <span class="visually-hidden">Choose event type</span>
              <img class="event__type-icon" width="17" height="17" src="img/icons/flight.png" alt="Event type icon">
            </label>
            <input class="event__type-toggle visually-hidden" id="event-type-toggle-new" type="checkbox">
          </div>

          <div class="event__field-group event__field-group--destination">
            <label class="event__label event__type-output" for="event-destination-new">Flight</label>
            <input class="event__input event__input--destination" id="event-destination-new" type="text" name="event-destination" value="Geneva" list="destination-list-new">
            <datalist id="destination-list-new">
              <option value="Amsterdam"></option>
              <option value="Geneva"></option>
              <option value="Chamonix"></option>
            </datalist>
          </div>

          <div class="event__field-group event__field-group--time">
            <label class="visually-hidden" for="event-start-time-new">From</label>
            <input class="event__input event__input--time" id="event-start-time-new" type="text" name="event-start-time" value="19/03/19 00:00">
            &mdash;
            <label class="visually-hidden" for="event-end-time-new">To</label>
            <input class="event__input event__input--time" id="event-end-time-new" type="text" name="event-end-time" value="19/03/19 00:00">
          </div>

          <div class="event__field-group event__field-group--price">
            <label class="event__label" for="event-price-new">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input class="event__input event__input--price" id="event-price-new" type="text" name="event-price" value="">
          </div>

          <button class="event__save-btn btn btn--blue" type="submit">Save</button>
          <button class="event__reset-btn" type="reset">Cancel</button>
        </header>
      </form>
    </li>
  `;
}

export default class NewPointView extends View {
  get template() {
    return createNewPointTemplate();
  }
}
