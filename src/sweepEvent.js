/**
 * Представляет единичное событие в алгоритме "заметающей прямой" (sweep-line).
 */
export default class SweepEvent {
  /**
   * Создает новое событие заметания для заданного типа.
   */
  constructor(point, segment) {
    this.point = point;
    if (segment) this.from = [segment];
  }
}
