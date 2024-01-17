export const EPS = 1e-9;


/**
 * @typedef {Object} Point
 * @property {number} x - X-координата точки.
 * @property {number} y - Y-координата точки.
 */

/**
 * @typedef {Object} Segment
 * @property {Point} from - Начальная точка сегмента.
 * @property {Point} to - Конечная точка сегмента.
 * @property {number} dx - Изменение координаты X от начала до конца сегмента.
 * @property {number} dy - Изменение координаты Y от начала до конца сегмента.
 */

/**
 * Вычисляет X-координату точки пересечения отрезка с вертикальной линией.
 * @param {Segment} segment - Отрезок с начальной и конечной точками {x, y}.
 * @param {number} xPos - X-координата вертикальной линии.
 * @param {number} yPos - Y-координата точки на вертикальной линии.
 * @returns {number} - X-координата точки пересечения.
 */
export function getIntersectionXPoint(segment, xPos, yPos) {
  var dy1 = segment.from.y - yPos;
  var dy2 = yPos - segment.to.y;
  var dy = segment.to.y - segment.from.y;
  if (Math.abs(dy1) < EPS) {
    // The segment starts on the sweep line
    if (Math.abs(dy) < EPS) {
      // the segment is horizontal. Intersection is at the point
      if (xPos <= segment.from.x) return segment.from.x;
      if (xPos > segment.to.x) return segment.to.x;
      return xPos;
    }
    return segment.from.x;
  }
  
  var dx = (segment.to.x - segment.from.x); 
  var xOffset; 
  if (dy1 >= dy2) {
    xOffset = dy1 * (dx / dy); 
    return (segment.from.x - xOffset);
  } 
  xOffset = dy2 * (dx / dy);
  return (segment.to.x + xOffset);
}

/**
 * Вычисляет угол вектора способом, который быстрее, чем использование тригонометрических функций.
 * @param {number} dx - X-компонента вектора.
 * @param {number} dy - Y-компонента вектора.
 * @returns {number} - Псевдоугол вектора.
 */
export function angle(dx, dy) {
  // https://stackoverflow.com/questions/16542042/fastest-way-to-sort-vectors-by-angle-without-actually-computing-that-angle
  var p = dx/(Math.abs(dx) + Math.abs(dy)) // -1 .. 1 increasing with x

  if (dy < 0) return p - 1;  // -2 .. 0 increasing with x
  return 1 - p               //  0 .. 2 decreasing with x
}

/**
 * Определяет точку пересечения двух отрезков, если она существует.
 * @param {Segment} a - Первый отрезок.
 * @param {Segment} b - Второй отрезок.
 * @returns {Point|null} - Точка пересечения или null, если пересечения нет.
 */
export function intersectSegments(a, b) {
  //  https://stackoverflow.com/a/1968345/125351
  var aStart = a.from, bStart = b.from;
  var p0_x = aStart.x, p0_y = aStart.y,
      p2_x = bStart.x, p2_y = bStart.y;

  var s1_x = a.dx, s1_y = a.dy, s2_x = b.dx, s2_y = b.dy;
  var div = s1_x * s2_y - s2_x * s1_y;

  var s = (s1_y * (p0_x - p2_x) - s1_x * (p0_y - p2_y)) / div;
  if (s < 0 || s > 1) return;

  var t = (s2_x * (p2_y - p0_y) + s2_y * (p0_x - p2_x)) / div;

  if (t >= 0 && t <= 1) {
    return {
      x: p0_x - (t * s1_x),
      y: p0_y - (t * s1_y)
    }
  }
}

/**
 * Проверяет, совпадают ли две точки (x0, y0) и (x1, y1) с небольшой погрешностью.
 * @param {number} x0 - X-координата первой точки.
 * @param {number} x1 - X-координата второй точки.
 * @param {number} y0 - Y-координата первой точки.
 * @param {number} y1 - Y-координата второй точки.
 * @returns {boolean} - True, если точки считаются одинаковыми, иначе false.
 */
export function same(x0, x1, y0, y1) {
  return Math.abs(x0 - x1) < EPS && Math.abs(y0 - y1) < EPS;
}

/**
 * Проверяет, совпадают ли две точки, представленные как объекты с свойствами x и y, с небольшой погрешностью.
 * @param {Object} a - Первая точка со свойствами x и y.
 * @param {Object} b - Вторая точка со свойствами x и y.
 * @returns {boolean} - True, если точки считаются одинаковыми, иначе false.
 */
export function samePoint(a, b) {
  return Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;
}