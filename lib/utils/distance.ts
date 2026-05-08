type Coordinate = {
  lat: number;
  lng: number;
};

export function calculateMidpoint(a: Coordinate, b: Coordinate): Coordinate {
  return {
    lat: (a.lat + b.lat) / 2,
    lng: (a.lng + b.lng) / 2,
  };
}

export function calculateDistancePlaceholder() {
  return 0;
}
