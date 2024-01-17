import createEventQueue from './createEventQueue';
import createSweepStatus from './sweepStatus';
import SweepEvent from './SweepEvent';

import { intersectSegments, EPS, angle, samePoint } from './geom';

/**
 * A point on a line
 * 
 * @typedef {Object} Point
 * @property {number} x coordinate
 * @property {number} y coordinate
 */


/**
 * @typedef {Object} Segment 
 * @property {Point} from start of the segment
 * @property {Point} to end of the segment
 */

/**
 * @typedef {function(point : Point, interior : Segment[], lower : Segment[], upper : Segment[])} ReportIntersectionCallback
 */

/**
 * @typedef {Object} ISectOptions 
 * @property {ReportIntersectionCallback} onFound 
 */

/**
 * @typedef {Object} ISectResult
 */


var EMPTY = [];

/**
 * @param {Segment[]} segments
 * @param {ISectOptions=} options
 * @returns {ISectResult}
 */
export default function isect(segments, options) {
  var results = [];
  var reportIntersection = (options && options.onFound) || defaultIntersectionReporter;

  var onError = (options && options.onError) || defaultErrorReporter;

  var eventQueue = createEventQueue(byY);
  var sweepStatus = createSweepStatus(onError, EPS);
  var lower, interior, lastPoint;

  var sweepState = {
    currentSweepLineY: null,
  }


  segments.forEach(addSegment);

  return {
    run,
    step,
    addSegment,
    eventQueue,
    sweepStatus,
    results,
    sweepState,
  }

  function run() {
    while (!eventQueue.isEmpty()) {
      var eventPoint = eventQueue.pop();
      if (handleEventPoint(eventPoint)) {
        // they decided to stop.
        return;
      };
    }

    return results;
  }

  function step() {
    if (!eventQueue.isEmpty()) {
      var eventPoint = eventQueue.pop();
      handleEventPoint(eventPoint);
      return true;
    }
    return false;
  }

  function handleEventPoint(p) {
    sweepState.currentSweepLineY = p.point.y
    lastPoint = p.point;
    var upper = p.from || EMPTY;

    lower = interior = undefined;

    sweepStatus.findSegmentsWithPoint(lastPoint, addLowerOrInterior);

    if (!lower) lower = EMPTY;
    if (!interior) interior = EMPTY;

    var uLength = upper.length;
    var iLength = interior.length;
    var lLength = lower.length;
    var hasIntersection = uLength + iLength + lLength > 1;
    var hasPointIntersection = !hasIntersection && (uLength === 0 && lLength === 0 && iLength > 0);

    if (hasIntersection || hasPointIntersection) {
      p.isReported = true;
      if (reportIntersection(lastPoint, union(interior, union(lower, upper)))) {
        return true;
      }
    }

    sweepStatus.deleteSegments(lower, interior, lastPoint);
    sweepStatus.insertSegments(interior, upper, lastPoint);

    var sLeft, sRight;

    var hasNoCrossing = (uLength + iLength === 0);

    if (hasNoCrossing) {
      var leftRight = sweepStatus.getLeftRightPoint(lastPoint);
      sLeft = leftRight.left;
      if (!sLeft) return;

      sRight = leftRight.right;
      if (!sRight) return;

      findNewEvent(sLeft, sRight, p);
    } else {
      var boundarySegments = sweepStatus.getBoundarySegments(upper, interior);

      findNewEvent(boundarySegments.beforeLeft, boundarySegments.left, p);
      findNewEvent(boundarySegments.right, boundarySegments.afterRight, p);
    }

    return false;
  }

  function addLowerOrInterior(s) {
    if (samePoint(s.to, lastPoint)) {
      if (!lower) lower = [s];
      else lower.push(s);
    } else if (!samePoint(s.from, lastPoint)) {
      if (!interior) interior = [s];
      else interior.push(s);
    }
  }

  function findNewEvent(left, right, p) {
    if (!left || !right) return;

    var intersection = intersectSegments(left, right);
    if (!intersection) {
      return;
    }

    var dy = p.point.y - intersection.y

    if (dy < -EPS) {
      // Это означает, что пересечение произошло после линии заметания.
      // Мы уже его обработали.
      return;
    }
    if (Math.abs(dy) < EPS && intersection.x <= p.point.x) {
      return;
    }

    // Необходимо скорректировать плавающую запятую для этого особого случая,
    // так как в противном случае могут возникнуть ошибки округления:
    roundNearZero(intersection);

    var current = eventQueue.find(intersection);

    if (current && current.isReported) {
      onError('We already reported this event.');
      return;
    }

    if (!current) {
      var event = new SweepEvent(intersection)
      eventQueue.insert(event);
    }
  }

  function defaultIntersectionReporter(p, segments) {
    results.push({
      point: p,
      segments: segments
    });
  }

  function addSegment(segment) {
    var from = segment.from;
    var to = segment.to;

    // Маленькие числа вызывают больше ошибок округления. Округляем их до 0.
    roundNearZero(from);
    roundNearZero(to);

    var dy = from.y - to.y;

    if (Math.abs(dy) < 1e-5) {
      from.y = to.y;
      segment.dy = 0;
    }
    if ((from.y < to.y) || (
      (from.y === to.y) && (from.x > to.x))
    ) {
      var temp = from;
      from = segment.from = to;
      to = segment.to = temp;
    }

    // Мы предварительно вычисляем некоторые неизменяемые свойства отрезка.
    // Они часто используются при обходе дерева и предварительные вычисления
    // значительно увеличивают производительность:
    segment.dy = from.y - to.y;
    segment.dx = from.x - to.x;
    segment.angle = angle(segment.dy, segment.dx);

    var isPoint = segment.dy === segment.dx && segment.dy === 0;
    var prev = eventQueue.find(from)
    if (prev && !isPoint) {
      // Это позволяет рано обнаружить идентичные отрезки. Без этой проверки
      // алгоритм сломался бы, так как линия сканирования не способна
      // обнаружить идентичные отрезки.
      var prevFrom = prev.data.from;
      if (prevFrom) {
        for (var i = 0; i < prevFrom.length; ++i) {
          var s = prevFrom[i];
          if (samePoint(s.to, to)) {
            reportIntersection(s.from, [s.from, s.to]);
            reportIntersection(s.to, [s.from, s.to]);
            return;
          }
        }
      }
    }

    if (!isPoint) {
      if (prev) {
        if (prev.data.from) prev.data.from.push(segment);
        else prev.data.from = [segment];
      } else {
        var e = new SweepEvent(from, segment)
        eventQueue.insert(e);
      }
      var event = new SweepEvent(to)
      eventQueue.insert(event)
    } else {
      var event = new SweepEvent(to)
      eventQueue.insert(event)
    }
  }
}

function roundNearZero(point) {
  if (Math.abs(point.x) < EPS) point.x = 0;
  if (Math.abs(point.y) < EPS) point.y = 0;
}

function defaultErrorReporter(errorMessage) {
  throw new Error(errorMessage);
}

function union(a, b) {
  if (!a) return b;
  if (!b) return a;

  return a.concat(b);
}

function byY(a, b) {
  // decreasing Y 
  var res = b.y - a.y;
  if (Math.abs(res) < EPS) {
    // increasing x.
    res = a.x - b.x;
    if (Math.abs(res) < EPS) res = 0;
  }

  return res;
}