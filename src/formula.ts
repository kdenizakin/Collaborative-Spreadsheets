const FormulaParser = require("fast-formula-parser");

import { useYMapStore, useYColumnsStore, useYRowsStore } from "./YjsStore";

let yColumns = useYColumnsStore.getState().yColumns;
let yRows = useYRowsStore.getState().yRows;
const yMap = useYMapStore.getState().yMap;

//Error handling

let data: (string | number)[][] = [];
let markedCells: string[];

const parserDriver = (
  formula: string,
  position: { row: number; col: number; sheetName: string },
) => {
  markedCells = [];
  let result = {
    markedCells: markedCells,
    formulaResult: parser.parse(formula, position, true),
  };
  return result;
};

const parser = new FormulaParser({
  onVariable: () => {
    // If it is a range reference (A1:B2)
    return {
      sheet: "sheet name",
      from: {
        row: 1,
        col: 1,
      },
      to: {
        row: 2,
        col: 2,
      },
    };
    // If it is a cell reference (A1)
    return {
      sheet: "sheet name",
      row: 1,
      col: 1,
    };
  },

  onCell: ({ row, col }: { sheet?: string; row: number; col: number }) => {
    //For example: A1 + 5
    return data[row - 1][col - 1];
  },

  onRange: (ref: {
    from: { row: number; col: number };
    to: { row: number; col: number };
  }) => {
    //ex: SUM(A1:B2)
    const arr = [];

    for (let row = ref.from.row; row <= ref.to.row; row++) {
      const innerArr = [];
      for (let col = ref.from.col; col <= ref.to.col; col++) {
        let cellId: string = `${yColumns.get(col - 1)},${yRows.get(row - 1)}`;
        if (!Number.isNaN(Number(yMap.get(cellId)![0].content))) {
          innerArr.push(Number(yMap.get(cellId)![0].content));
        } else innerArr.push("");
        markedCells.push(cellId);
      }
      arr.push(innerArr);
    }
    return arr;
  },
});

const handleFormula = (
  completeFormula: string,
  position: { row: number; col: number; sheetName: string },
  formulaCellId: string,
): { markedCells: string[]; formulaResult: string } => {
  let result: {
    markedCells: string[];
    formulaResult: any;
  } = parserDriver(completeFormula, position); //returns marked cells and formula result as a object.

  for (let i = 0; i < result.markedCells.length; i++) {
    //to detect circular reference
    if (formulaCellId === result.markedCells[i]) {
      console.log("Circular reference detected!");
      result = {
        markedCells: [],
        formulaResult: "0",
      };
    }
  }
  return result;
};

export { handleFormula };
