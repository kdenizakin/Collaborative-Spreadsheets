import { create } from "zustand";

type SpreadSheetStore = {
  rows: [];
  returnSpreadsheet: () => [];
};

const useSpreadsheetStore = create<SpreadSheetStore>((set) => ({
  //this is a "zustand" implementation to fetch the spreadsheet data. Less implementation needed and simpler compared to Redux and this is not a global state rather for components which want to use it.
  // This data is fetched by "formula.tsx" to make calculations.
  rows: [],

  returnSpreadsheet: () => {
    for (let i = 0; i < yRows.length; i++) {
      for (let j = 0; j < yColumns.length; j++) {
        let cellId: string = `${columns[j].id},${rows[i].id}`;
        set((state) => ({
          rows: state.rows[i].push(yMap.get(cellId).content),
        }));
      }
    }
    return {
      rows,
    };
  },
  reset: () => {
    set({
      rows: [],
    });
  },
}));

export { useSpreadsheetStore };
