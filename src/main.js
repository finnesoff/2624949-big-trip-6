import TripPresenter from './presenter/trip-presenter';
import PointsModel from './model/points-model';

const filtersContainer = document.querySelector('.trip-controls__filters');
const tripEventsContainer = document.querySelector('.trip-events');
const pointsModel = new PointsModel();

const tripPresenter = new TripPresenter({
  filtersContainer,
  tripEventsContainer,
  pointsModel,
});

tripPresenter.init();
