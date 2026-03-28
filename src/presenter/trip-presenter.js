import { render, RenderPosition } from "../render";
import FiltersView from "../view/filters-view";
import SortView from "../view/sort-view";
import ListView from "../view/list-view";
import PointView from "../view/point-view";
import EditPointView from "../view/edit-point-view";
import NewPointView from "../view/new-point-view";

const POINTS_COUNT = 3;

export default class TripPresenter {
  #filtersContainer = null;
  #tripEventsContainer = null;

  constructor({ filtersContainer, tripEventsContainer }) {
    this.#filtersContainer = filtersContainer;
    this.#tripEventsContainer = tripEventsContainer;
  }

  init() {
    const filtersComponent = new FiltersView();
    const sortComponent = new SortView();
    const listComponent = new ListView();
    const editPointComponent = new EditPointView();
    const newPointComponent = new NewPointView();

    render(filtersComponent, this.#filtersContainer);
    render(sortComponent, this.#tripEventsContainer);
    render(listComponent, this.#tripEventsContainer);

    const pointListContainer = listComponent.getElement();

    render(editPointComponent, pointListContainer, RenderPosition.AFTERBEGIN);
    render(newPointComponent, pointListContainer);

    for (let i = 0; i < POINTS_COUNT; i++) {
      render(new PointView(), pointListContainer);
    }
  }
}
