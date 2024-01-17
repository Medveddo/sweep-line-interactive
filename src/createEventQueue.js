import SplayTree from 'splaytree';


export default function createEventQueue(comparator) {
  const q = new SplayTree(comparator);

  return {
    isEmpty: isEmpty,
    size: size,
    pop: pop,
    find: find,
    insert: insert,
    q: q,
  }

  function find(p) {
    return q.find(p);
  }

  function size() {
    return q.size;
  }

  function isEmpty() {
    return q.isEmpty();
  }

  function insert(event) {
    q.add(event.point, event);
  }

  function pop() {
    var node = q.pop();
    return node && node.data;
  }
}