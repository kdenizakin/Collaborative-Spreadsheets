const FormulaParser = require("fast-formula-parser");

import { useYMapStore, useYColumnsStore, useYRowsStore } from "./YjsStore";
import Swal from "sweetalert2";
import * as Y from "yjs";

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

const findYArrayElement = (id: string, yArray: Y.Array<string>): number => {
  let index: number = 0;
  for (let i = 0; i < yArray.length; i++) {
    if (id === (yArray.get(i) as string)) index = i;
  }
  return index;
};

const getColumnLabel = (index: number): string => {
  return (index + 1).toString();
};

const getRowLabel = (index: number): string => {
  let label = "";
  let num = index;
  while (num >= 0) {
    label = String.fromCharCode((num % 26) + 65) + label;
    num = Math.floor(num / 26) - 1;
  }
  return label;
};

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
      let cellColId: string = result.markedCells[i].split(",")[0];
      let cellRowId: string = result.markedCells[i].split(",")[1];
      let cellColPosition: string = getColumnLabel(
        findYArrayElement(cellColId, yColumns),
      );
      let cellRowPosition: string = getRowLabel(
        findYArrayElement(cellRowId, yRows),
      );

      Swal.fire({
        title: "Circular reference detected!",
        text:
          "Circular reference detected on cell " +
          cellRowPosition +
          cellColPosition,
        icon: "error",
        confirmButtonText: "Got it!",
      });

      let timerInterval: NodeJS.Timeout;
      Swal.fire({
        title: "Circular reference detected!",
        html:
          "Circular reference detected on cell " +
          cellRowPosition +
          cellColPosition,
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
          const timer = Swal.getPopup()!.querySelector("b");
          timerInterval = setInterval(() => {
            timer!.textContent = `${Swal.getTimerLeft()}`;
          }, 100);
        },
        willClose: () => {
          clearInterval(timerInterval);
        },
      }).then((result) => {
        if (result.dismiss === Swal.DismissReason.timer)
          console.log("I was closed by the timer");
      });
      result = {
        markedCells: [],
        formulaResult: "0",
      };
    }
  }
  return result;
};

export { handleFormula };
