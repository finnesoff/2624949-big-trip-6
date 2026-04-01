import { EVENT_TYPES } from '../const';

const CITY_NAMES = ['Amsterdam', 'Geneva', 'Chamonix', 'Paris', 'Rome'];
const LOREM_SENTENCES = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Cras aliquet varius magna, non porta ligula feugiat eget.',
  'Fusce tristique felis at fermentum pharetra.',
  'Aliquam id orci ut lectus varius viverra.',
  'Nullam nunc ex, convallis sed finibus eget, sollicitudin eget ante.',
  'Phasellus eros mauris, condimentum sed nibh vitae, sodales efficitur ipsum.',
  'Sed blandit, eros vel aliquam faucibus, purus ex euismod diam, eu luctus nunc ante ut dui.',
  'Sed sed nisi sed augue convallis suscipit in sed felis.',
  'Aliquam erat volutpat.',
  'Nunc fermentum tortor ac porta dapibus.',
  'In rutrum ac purus sit amet tempus.',
];

const OFFER_TEMPLATES_BY_TYPE = {
  taxi: [
    { title: 'Order Uber', price: 20 },
    { title: 'Upgrade to a business class', price: 70 },
  ],
  bus: [
    { title: 'Infotainment system', price: 5 },
    { title: 'Order meal', price: 15 },
  ],
  train: [
    { title: 'Book a taxi at destination', price: 20 },
    { title: 'Travel by first class', price: 40 },
  ],
  ship: [
    { title: 'Choose seats', price: 10 },
    { title: 'Order meal', price: 20 },
  ],
  drive: [
    { title: 'Rent a car', price: 200 },
    { title: 'Add full insurance', price: 80 },
  ],
  flight: [
    { title: 'Add luggage', price: 30 },
    { title: 'Switch to comfort class', price: 100 },
    { title: 'Add meal', price: 15 },
  ],
  'check-in': [
    { title: 'Add breakfast', price: 50 },
    { title: 'Late checkout', price: 30 },
  ],
  sightseeing: [
    { title: 'Book tickets', price: 40 },
    { title: 'Lunch in city', price: 30 },
  ],
  restaurant: [
    { title: 'Choose table', price: 15 },
    { title: 'Order transfer', price: 20 },
  ],
};

const getRandomInteger = (min, max) => {
  const lower = Math.ceil(Math.min(min, max));
  const upper = Math.floor(Math.max(min, max));
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
};

const getRandomItem = (items) => items[getRandomInteger(0, items.length - 1)];

const getRandomItems = (items, count) => {
  const clonedItems = [...items];
  const result = [];

  while (clonedItems.length > 0 && result.length < count) {
    const randomIndex = getRandomInteger(0, clonedItems.length - 1);
    const [item] = clonedItems.splice(randomIndex, 1);
    result.push(item);
  }

  return result;
};

const createDescription = () =>
  getRandomItems(LOREM_SENTENCES, getRandomInteger(1, 5)).join(' ');

const createDestination = (index, cityName) => ({
  id: `destination-${index + 1}`,
  name: cityName,
  description: createDescription(),
  pictures: Array.from(
    { length: getRandomInteger(1, 3) },
    (_, pictureIndex) => ({
      src: `https://loremflickr.com/248/152?random=${index * 10 + pictureIndex + 1}`,
      description: `${cityName} photo`,
    }),
  ),
});

const createOffers = () => {
  let offerIdCounter = 1;

  return EVENT_TYPES.flatMap((type) =>
    OFFER_TEMPLATES_BY_TYPE[type].map((offer) => ({
      id: `offer-${offerIdCounter++}`,
      type,
      title: offer.title,
      price: offer.price,
    })),
  );
};

const createPoint = (index, destinations, offers) => {
  const type = getRandomItem(EVENT_TYPES);
  const destination = getRandomItem(destinations);
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() + index);
  dateFrom.setHours(getRandomInteger(6, 20), getRandomInteger(0, 59), 0, 0);

  const dateTo = new Date(dateFrom);
  dateTo.setMinutes(dateTo.getMinutes() + getRandomInteger(30, 240));

  const offersForType = offers.filter((offer) => offer.type === type);
  const selectedOffers = getRandomItems(
    offersForType,
    getRandomInteger(0, offersForType.length),
  );

  return {
    id: `point-${index + 1}`,
    type,
    destinationId: destination.id,
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    basePrice: getRandomInteger(20, 900),
    isFavorite: Boolean(getRandomInteger(0, 1)),
    offerIds: selectedOffers.map((offer) => offer.id),
  };
};

const generatePointsData = (count = 3) => {
  const destinations = CITY_NAMES.map(createDestination);
  const offers = createOffers();
  const points = Array.from({ length: count }, (_, index) =>
    createPoint(index, destinations, offers),
  );

  return { points, destinations, offers };
};

export { generatePointsData };
