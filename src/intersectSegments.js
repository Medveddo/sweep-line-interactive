export default function intersectSegments(a, b) {
    // Примечание: это практически то же самое, что и geom.intersectSegments()
    // Основное различие заключается в том, что у нас нет предварительно вычисленного
    // значения dx/dy для отрезков.
    // https://stackoverflow.com/a/1968345/125351
    var aStart = a.from, bStart = b.from;
    var p0_x = aStart.x, p0_y = aStart.y,
        p2_x = bStart.x, p2_y = bStart.y;
  
    var s1_x = a.from.x - a.to.x, s1_y = a.from.y - a.to.y, s2_x = b.from.x - b.to.x, s2_y = b.from.y - b.to.y;
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