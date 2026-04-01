import { generatePointsData } from '../mock/point';

export default class PointsModel {
  #points = [];
  #destinations = [];
  #offers = [];

  constructor() {
    const { points, destinations, offers } = generatePointsData();

    this.#points = points;
    this.#destinations = destinations;
    this.#offers = offers;
  }

  get points() {
    return this.#points;
  }

  get destinations() {
    return this.#destinations;
  }

  get offers() {
    return this.#offers;
  }
}
