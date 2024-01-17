import SplayTree from 'splaytree';
import { samePoint, getIntersectionXPoint } from './geom'


export default function createSweepStatus(onError, EPS) {
  var lastPointY, prevY;
  var lastPointX, prevX;
  var useBelow = false;
  var status = new SplayTree(compareSegments);

  var currentBoundary = {
    beforeLeft: null,
    left: null,
    right: null,
    afterRight: null,
  }

  var currentLeftRight = { left: null, right: null };

  return {
    insertSegments,
    deleteSegments,

    /**
     * Возвращает отрезки, находящиеся слева и справа от данной точки.
     */
    getLeftRightPoint, // Получает левые и правые отрезки для точки

    /**
     * Для данной коллекции отрезков находит самый левый и самый правый
     * отрезки. Также возвращает отрезки непосредственно перед самым левым и после
     * самого правого отрезков.
     */
    getBoundarySegments, // Получает граничные отрезки

    findSegmentsWithPoint, // Находит отрезки с данной точкой

    /**
     * Текущее бинарное дерево поиска с отрезками
     */
    status,

    /**
     * Метод интроспекции, который проверяет наличие дубликатов в дереве отрезков.
     * Если они есть - вызывается `onError()`.
     */
    checkDuplicate,

    /**
     * Выводит текущие отрезки в порядке их пересечения с линией сканирования. Метод интроспекции.
     */
    printStatus,

    /**
     * Возвращает текущее положение линии сканирования.
     */
    getLastPoint() {
      return { x: lastPointX, y: lastPointY };
    }
  }

  function compareSegments(a, b) {
    if (a === b) return 0;

    var ak = getIntersectionXPoint(a, lastPointX, lastPointY);
    var bk = getIntersectionXPoint(b, lastPointX, lastPointY);

    var res = ak - bk;
    if (Math.abs(res) >= EPS) {
      return res;
    }

    var aIsHorizontal = Math.abs(a.dy) < EPS;
    var bIsHorizontal = Math.abs(b.dy) < EPS;
    if (aIsHorizontal && bIsHorizontal) {
      return b.to.x - a.to.x;
    }

    if (aIsHorizontal) {
      return useBelow ? -1 : 1;
    }

    if (bIsHorizontal) {
      if (useBelow) {
        return (b.from.x >= lastPointX) ? -1 : 1
      }
      return -1;
    }
    var pa = a.angle;
    var pb = b.angle;
    if (Math.abs(pa - pb) >= EPS) {
      return useBelow ? pa - pb : pb - pa;
    }

    var segDist = a.from.y - b.from.y;
    if (Math.abs(segDist) >= EPS) {
      return -segDist;
    }
    segDist = a.to.y - b.to.y;
    if (Math.abs(segDist) >= EPS) {
      return -segDist;
    }

    return 0;
  }

  function getBoundarySegments(upper, interior) {
    var leftMost, rightMost, i;
    var uLength = upper.length;

    if (uLength > 0) {
      leftMost = rightMost = upper[0];
    } else {
      leftMost = rightMost = interior[0];
    }

    for (i = 1; i < uLength; ++i) {
      var s = upper[i];
      var cmp = compareSegments(leftMost, s);
      if (cmp > 0) leftMost = s;

      cmp = compareSegments(rightMost, s);
      if (cmp < 0) rightMost = s;
    }

    var startFrom = uLength > 0 ? 0 : 1;
    for (i = startFrom; i < interior.length; ++i) {
      s = interior[i];
      cmp = compareSegments(leftMost, s);
      if (cmp > 0) leftMost = s;

      cmp = compareSegments(rightMost, s);
      if (cmp < 0) rightMost = s;
    }

    // В этот момент у нас есть наши левые/правые отрезки в состоянии.
    // Давайте найдем их предыдущие/следующие элементы и вернем их обратно:
    var left = status.find(leftMost);
    if (!left) {
      onError('Left is missing. Precision error?');
    }

    var right = status.find(rightMost);
    if (!right) {
      onError('Right is missing. Precision error?');
    }

    var beforeLeft = left && status.prev(left);
    var afterRight = right && status.next(right);

    while (afterRight && right.key.dy === 0 && afterRight.key.dy === 0) {
      afterRight = status.next(afterRight);
    }

    currentBoundary.beforeLeft = beforeLeft && beforeLeft.key;
    currentBoundary.left = left && left.key;
    currentBoundary.right = right && right.key;
    currentBoundary.afterRight = afterRight && afterRight.key;

    return currentBoundary;
  }

  function getLeftRightPoint(p) {
    // Мы пытаемся найти левые и правые отрезки, ближайшие к точке p. 
    // Для этого мы обходим бинарное дерево поиска
    // и запоминаем узел с самым коротким расстоянием до p.
    var lastLeft;
    var current = status._root;
    var minX = Number.POSITIVE_INFINITY;

    var useNext = false;
    while (current) {
      var x = getIntersectionXPoint(current.key, p.x, p.y);
      var dx = p.x - x;
      if (dx >= 0) {
        if (dx < minX) {
          minX = dx;
          lastLeft = current;
          current = current.left;
          useNext = false;
        } else {
          break;
        }
      } else {
        if (-dx < minX) {
          useNext = true;
          minX = -dx;
          lastLeft = current;
          current = current.right;
        } else {
          break;
        }
      }
    }
    if (useNext) {
      // lastLeft = status.next(lastLeft);
    }

    currentLeftRight.left = lastLeft && lastLeft.key
    var next = lastLeft && status.next(lastLeft);
    currentLeftRight.right = next && next.key
    return currentLeftRight;

  }

  function findSegmentsWithPoint(p, onFound) {
    var current = status._root;

    while (current) {
      var x = getIntersectionXPoint(current.key, p.x, p.y);
      var dx = p.x - x;
      if (Math.abs(dx) < EPS) {
        collectAdjacentNodes(current, p, onFound);
        break;
      } else if (dx < 0) {
        current = current.left;
      } else {
        current = current.right;
      }
    }
  }

  function collectAdjacentNodes(root, p, onFound) {
    onFound(root.key);
    goOverPredecessors(root.left, p, onFound);
    goOverSuccessors(root.right, p, onFound);
  }

  function goOverPredecessors(root, p, res) {
    if (!root) return;
    var x = getIntersectionXPoint(root.key, p.x, p.y);
    var dx = p.x - x;
    if (Math.abs(dx) < EPS) {
      collectAdjacentNodes(root, p, res);
    } else {
      goOverPredecessors(root.right, p, res);
    }
  }

  function goOverSuccessors(root, p, res) {
    if (!root) return;
    var x = getIntersectionXPoint(root.key, p.x, p.y);
    var dx = p.x - x;
    if (Math.abs(dx) < EPS) {
      collectAdjacentNodes(root, p, res);
    } else {
      goOverSuccessors(root.left, p, res);
    }
  }

  function checkDuplicate() {
    var prev;
    status.forEach(node => {
      var current = node.key;

      if (prev) {
        if (samePoint(prev.from, current.from) && samePoint(prev.to, current.to)) {
          onError('Duplicate key in the status! This may be caused by Floating Point rounding error')
        }
      }
      prev = current;
    });
  }

  function printStatus(prefix = '') {
    console.log(prefix, 'status line: ', lastPointX, lastPointY);
    status.forEach(node => {
      var x = getIntersectionXPoint(node.key, lastPointX, lastPointY);
      console.log(x + ' ' + node.key.name);
    })
  }

  function insertSegments(interior, upper, sweepLinePos) {
    lastPointY = sweepLinePos.y;
    lastPointX = sweepLinePos.x;
    var key;

    for (var i = 0; i < interior.length; ++i) {
      key = interior[i];
      status.add(key);
    }
    for (i = 0; i < upper.length; ++i) {
      key = upper[i]
      status.add(key);
    }
  }

  function deleteSegments(lower, interior, sweepLinePos) {
    var i;
    var prevCount = status._size;
    prevX = lastPointX;
    prevY = lastPointY;
    lastPointY = sweepLinePos.y;
    lastPointX = sweepLinePos.x;

    useBelow = true;
    for (i = 0; i < lower.length; ++i) {
      removeSegment(lower[i], sweepLinePos)
    }
    for (i = 0; i < interior.length; ++i) {
      removeSegment(interior[i], sweepLinePos)
    }
    useBelow = false;

    if (status._size !== prevCount - interior.length - lower.length) {
      onError('Segments were not removed from a tree properly. Precision error?');
    }
  }

  function removeSegment(key, sweepLinePos) {
    if (status.find(key)) {
      status.remove(key);
    } else {
      lastPointX = prevX;
      lastPointY = prevY;
      if (status.find(key)) {
        status.remove(key);
      } else {
      }
      lastPointY = sweepLinePos.y;
      lastPointX = sweepLinePos.x;
    }
  }
}