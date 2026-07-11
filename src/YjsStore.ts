import * as Y from "yjs";
import { create } from "zustand";

type YDocType = {
  documentId: string;
  setDocumentId: (id: string) => void;
  YDoc: any;
};

type CellType = {
  id: string;
  content: string;
  formula?: string;
};

type YMapType = {
  yMap: Y.Map<CellType[]>;
  setEntry: Function;
  deleteEntry: Function;
};

type RemoveKeepOperationId = `c${number}.${number}`;

type YColumnsType = {
  yColumns: Y.Array<string>;
};
type YRowsType = {
  yRows: Y.Array<string>;
};
type UndoYColumnsType = {
  undoColumns: Y.UndoManager;
};
type UndoYRowsType = {
  undoRows: Y.UndoManager;
};
type UndoYMapType = {
  undoMap: Y.UndoManager;
};
type YColKeepType = {
  yColKeep: Y.Map<RemoveKeepOperationId[]>;
};
type YRowKeepType = {
  yRowKeep: Y.Map<RemoveKeepOperationId[]>;
};

const useYDocStore = create<YDocType>((set) => ({
  documentId: "",
  YDoc: new Y.Doc(),
  setDocumentId: (id: string) => set({ documentId: id }),
}));

const useYMapStore = create<YMapType>((set, get) => ({
  yMap: useYDocStore.getState().YDoc.getMap("spreadsheet"),

  setEntry: (cellId: string, content: string) => {
    const { yMap } = get();
    yMap.set(cellId, [
      {
        id: useYDocStore.getState().YDoc.clientID,
        content: content as string,
      },
    ]);
    set({ yMap });
  },

  deleteEntry: (cellId: string) => {
    const { yMap } = get();
    yMap.delete(cellId);
    set({ yMap });
  },
}));

const useYColumnsStore = create<YColumnsType>((set) => ({
  yColumns: useYDocStore.getState().YDoc.getArray("columns"),
}));

const useYRowsStore = create<YRowsType>((set) => ({
  yRows: useYDocStore.getState().YDoc.getArray("rows"),
}));

const useUndoYColumnsStore = create<UndoYColumnsType>((set) => ({
  undoColumns: new Y.UndoManager(useYColumnsStore.getState().yColumns),
}));

const useUndoYRowsStore = create<UndoYRowsType>((set) => ({
  undoRows: new Y.UndoManager(useYRowsStore.getState().yRows),
}));

const useUndoMapStore = create<UndoYMapType>((set) => ({
  undoMap: new Y.UndoManager(useYMapStore.getState().yMap),
}));

const useYColKeepStore = create<YColKeepType>((set) => ({
  yColKeep: useYDocStore.getState().YDoc.getMap("column-keep"),
}));

const useYRowKeepStore = create<YRowKeepType>((set) => ({
  yRowKeep: useYDocStore.getState().YDoc.getMap("row-keep"),
}));

export {
  useYDocStore,
  useYMapStore,
  useYColumnsStore,
  useYRowsStore,
  useUndoYColumnsStore,
  useUndoYRowsStore,
  useUndoMapStore,
  useYColKeepStore,
  useYRowKeepStore,
};
