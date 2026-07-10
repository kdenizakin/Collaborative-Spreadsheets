import { create } from "zustand";
import { useYMapStore, useYColumnsStore, useYRowsStore } from "./YjsStore";

const yMap = useYMapStore.getState().yMap;
const yColumns = useYColumnsStore.getState().yColumns;
const yRows = useYRowsStore.getState().yRows;

type SpreadSheetStore = {
  rows: string[][];
  fetchSpreadsheet: Function;
};

const returnSpreadsheet = () => {
  let matrix: string[][] = [];

  for (let i = 0; i < yRows.length; i++) {
    let currentRow: string[] = [];
    for (let j = 0; j < yColumns.length; j++) {
      let cellId: string = `${yColumns.get(j)},${yRows.get(i)}`;
      let cellData = yMap.get(cellId)[0];
      let content = cellData ? cellData.content : "";
      currentRow.push(content);
    }
    matrix.push(currentRow);
  }
  return matrix;
};

const useSpreadsheetStore = create<SpreadSheetStore>((set, get) => ({
  //this is a "zustand" implementation to fetch the spreadsheet data. Less implementation needed and simpler compared to Redux and this is not a global state rather for components which want to use it.
  // This data is fetched by "formula.tsx" to make calculations.
  rows: [],
  fetchSpreadsheet: () => {
    const data = returnSpreadsheet();
    set({ rows: data });
    return get().rows;
  },
}));
export { useSpreadsheetStore };
