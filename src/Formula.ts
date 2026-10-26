import { PriorityQueue } from "./SyncHeapClass";
import { useYMapStore, useYColumnsStore, useYRowsStore } from "./YjsStore";
import Swal from "sweetalert2";
const yColumns = useYColumnsStore.getState().yColumns;
const yRows = useYRowsStore.getState().yRows;
const yMap = useYMapStore.getState().yMap;

export class Formula {
  private FormulaParser = require("fast-formula-parser");

  private formula: string;
  private formulaResult: string;
  private data: (string | number)[][] = [];
  private cellId: string;
  private position: { row: number; col: string; sheetName: string };
  private markedCells: string[];
  private operation: string;
  private leftBoundaries: PriorityQueue;
  private rightBoundaries: PriorityQueue;

  public constructor(
    formula: string,
    cellId: string,
    position: { row: number; col: string; sheetName: string },
  ) {
    this.formula = formula;
    this.cellId = cellId;
    this.position = position;
    this.formulaResult = "";
    this.markedCells = [];
    this.operation = "";
    this.leftBoundaries = new PriorityQueue("Min", cellId);
    this.rightBoundaries = new PriorityQueue("Max", cellId);
    this.handleFormula(); //this sets values of 'markedCells' and 'formulaResult' attributes and boundaries.
  }
  // This function is used to construct a single formula string from the left and right boundaries of the formula.
  public constructSingleFormulaString = (): string => {
    if (this.leftBoundaries.isEmpty() || this.rightBoundaries.isEmpty()) {
      return "";
    }
    const operation = this.operation;
    const leftBoundary = this.leftBoundaries.peek();
    const rightBoundary = this.rightBoundaries.peek();
    return `${operation}(${leftBoundary}:${rightBoundary})`;
  };

  public findYArrayElement = (yArray: any, id: string): number => {
    let index: number = 0;
    for (let i = 0; i < yArray.length; i++) {
      if (id === (yArray.get(i) as string)) index = i;
    }
    return index;
  };

  public refreshFormulaBoundariesWhenColumnMoved = () => {
    // This function gets the new position of the formula cell from yrows and ycol array to change the boundaries of the formula cell. It is used when the formula cell is moved to a new position in the spreadsheet.
  };

  private parserDriver = (): {
    markedCells: string[];
    formulaResult: string;
  } => {
    this.markedCells = [];

    const parsedValue = this.parser.parse(
      this.formula,
      {
        row: this.position.row,
        col: this.position.col,
        sheet: this.position.sheetName,
      },
      true,
    );

    return {
      markedCells: [...new Set(this.markedCells)],
      formulaResult: String(parsedValue),
    };
  };

  parser = new this.FormulaParser({
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
      return this.data[row - 1][col - 1];
    },
    onRange: (ref: {
      from: { row: number; col: number };
      to: { row: number; col: number };
    }) => {
      //ex: SUM(A1:B2)
      const arr = [];

      for (let row = ref.from.row; row <= ref.to.row; row++) {
        const innerArr = [];
        let { from, to } = ref;
        for (let col = from.col; col <= to.col; col++) {
          let cellId: string = `${yColumns.get(col - 1)},${yRows.get(row - 1)}`;

          if (!Number.isNaN(Number(yMap.get(cellId)![0].content))) {
            innerArr.push(Number(yMap.get(cellId)![0].content));
          } else innerArr.push("");
          this.markedCells.push(cellId);
        }
        arr.push(innerArr);
      }
      return arr;
    },
  });
  private detectCircularReference = (markedCells: string[]): boolean => {
    for (let i = 0; i < markedCells.length; i++) {
      if (this.cellId === markedCells[i]) {
        console.log("Circular reference detected!");
        Swal.fire({
          title: "Circular reference detected!",
          html:
            "Circular reference detected on cell " +
            this.position.col +
            this.position.row,
          timer: 2000,
          timerProgressBar: true,
          didOpen: () => {
            Swal.showLoading();
          },
        }).then((result) => {
          if (result.dismiss === Swal.DismissReason.timer)
            console.log("Pop-up closed");
        });
        this.markedCells = [];
        this.formulaResult = "0";
        return true;
      }
    }
    return false;
  };

  private handleFormula = (): {} => {
    let result: {
      markedCells: string[];
      formulaResult: any;
    } = this.parserDriver(); //returns marked cells and formula result as a object.

    let circularReferenceDetected: boolean = this.detectCircularReference(
      result.markedCells,
    ); //detect circular reference and if detected, reset marked cells and formula result.
    if (circularReferenceDetected) {
      return result;
    }
    this.markedCells = result.markedCells;
    this.formulaResult = result.formulaResult;
    if (this.formula.split(":").length > 1) {
      //formula is a range reference (e.g. A1:B2).
      this.operation = this.formula.split("(")[0]; //get the operation from the formula result (e.g. SUM(A1:B2) => SUM)
      this.leftBoundaries.push(this.formula.split("(")[1].split(":")[0]);
      this.rightBoundaries.push(
        this.formula.split("(")[1].split(":")[1].split(")")[0],
      );
    }
    return result;
  };
  public recalculateFormula = (): {
    markedCells: string[];
    formulaResult: string;
  } => {
    this.handleFormula(); //recalculate the formula and update the marked cells and formula result.
    return {
      markedCells: this.markedCells,
      formulaResult: this.formulaResult,
    };
  };

  public getFormula = (): string => {
    return this.formula;
  };

  public getFormulaCellId = (): string => {
    return this.cellId;
  };

  public getPosition = (): { row: number; col: string; sheetName: string } => {
    return this.position;
  };

  public getFormulaResult = (): string => {
    return this.formulaResult;
  };

  public getMarkedCells = (): string[] => {
    return this.markedCells;
  };
}
