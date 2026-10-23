import * as Y from "yjs";
import { useYDocStore, type YDocType } from "./YjsStore";

/* import { useFormulaBoundariesHeapStore } from "./YjsStore";
import type { FormulaBoundariesHeap } from "./YjsStore";*/

const top = 0;
const parent = (i: number) => ((i + 1) >>> 1) - 1;
const left = (i: number) => (i << 1) + 1;
const right = (i: number) => (i + 1) << 1;

export class PriorityQueue {
  private heap: Y.Array<string>;
  private _indexes: Map<string, number>;
  private _comparator: (a: string, b: string) => boolean;
  private _doc: YDocType;

  constructor(type: "Min" | "Max", cellId: string) {
    this._doc = useYDocStore.getState();
    this.heap = this._doc.YDoc.getArray(`${cellId}_${type}_heap`);
    this._indexes = new Map<string, number>();
    if (type === "Max") {
      this._comparator = (a: string, b: string) => {
        let result: number = a.localeCompare(b);
        if (result === 0) {
          return false;
        }
        return result > 0;
      };
    } else {
      this._comparator = (a: string, b: string) => {
        let result: number = a.localeCompare(b);
        if (result === 0) {
          return false;
        }
        return result < 0;
      };
    }
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.size() == 0;
  }

  peek() {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.heap.get(top);
  }

  push(...values: string[]) {
    values.forEach((value) => {
      if (value !== undefined) {
        this.heap.push([value]);
        this._indexes.set(value, this.size() - 1);
        this._shiftUp();
      }
    });
    return this.size();
  }

  pop() {
    const poppedValue = this._getCorrectValue();
    if (poppedValue === undefined) return undefined;
    this._indexes.delete(poppedValue!);
    this._shiftDown();
    return poppedValue;
  }

  replace(value: string) {
    this.pop();
    this.push(value);
    return this.size();
  }

  _greater(i: number, j: number) {
    return this._comparator(this.heap.get(i), this.heap.get(j));
  }

  _swap(i: number, j: number) {
    console.log(`Swapping ${this.heap.get(i)} and ${this.heap.get(j)}`);
    if (!this.isIgnored(i)) {
      this._indexes.set(this.heap.get(i), j);
    }
    if (!this.isIgnored(j)) {
      this._indexes.set(this.heap.get(j), i);
    }
    const temp = this.heap.get(i);
    this._doc.YDoc.transact(() => {
      this.heap.delete(i);
      if (this.heap.get(j) !== undefined) {
        this.heap.insert(i, [this.heap.get(j)]);
      }
    });
    this._doc.YDoc.transact(() => {
      if (j < this.size()) {
        this.heap.delete(j);
        this.heap.insert(j, [temp]);
      }
    });
  }

  _shiftUp() {
    let node = this.size() - 1;
    while (node > top && this._greater(node, parent(node))) {
      this._swap(node, parent(node));
      node = parent(node);
    }
  }

  _shiftDown() {
    let node = top;
    while (
      (left(node) < this.size() && this._greater(left(node), node)) ||
      (right(node) < this.size() && this._greater(right(node), node))
    ) {
      let maxChild =
        right(node) < this.size() && this._greater(right(node), left(node))
          ? right(node)
          : left(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }

  contains(value: string) {
    return this._indexes.get(value);
  }

  isIgnored(index: number) {
    if (index < 0 || index >= this.size()) return true;
    return index !== this._indexes.get(this.heap.get(index));
  }

  updatePriority(value: string) {
    this.push(value);
  }

  removeElement(value: string) {
    this._indexes.delete(value);
  }
  private _getCorrectValue() {
    while (this.isIgnored(0)) {
      this.removeFirstElement();
      this._shiftDown();
    }
    if (this.heap.length === 0) {
      return undefined;
    }
    return this.removeFirstElement();
  }

  private removeFirstElement() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > top) {
      this._swap(top, bottom);
    }
    this.heap.delete(0, 1);
    return poppedValue;
  }

  clear() {
    this._doc.YDoc.transact(() => {
      this.heap.delete(0, this.heap.length);
    });
    this._indexes.clear();
  }
}
