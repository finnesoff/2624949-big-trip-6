export const FilterType = {
  EVERYTHING: 'everything',
  FUTURE: 'future',
  PRESENT: 'present',
  PAST: 'past',
};

export const filter = {
  [FilterType.EVERYTHING]: (points) => points,
  [FilterType.FUTURE]: (points) =>
    points.filter((point) => new Date(point.dateFrom) > new Date()),
  [FilterType.PRESENT]: (points) =>
    points.filter(
      (point) =>
        new Date(point.dateFrom) <= new Date() && new Date(point.dateTo) >= new Date()
    ),
  [FilterType.PAST]: (points) =>
    points.filter((point) => new Date(point.dateTo) < new Date()),
};
