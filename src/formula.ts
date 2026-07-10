const FormulaParser = require("fast-formula-parser");

const { FormulaHelpers, Types, FormulaError, MAX_ROW, MAX_COLUMN } =
  FormulaParser;

/* const data = [
  // A  B  C
  [1, 2, 3], // row 1
  [4, 5, 6], // row 2
]; */

let data: any[][] = [];

const parserDriver = (
  spreadsheetData: string[][],
  formula: string,
  position,
) => {
  data = spreadsheetData;
  let rowLength: number = data.length;
  let colLenght: number = data[0].length;
  for (let i = 0; i < colLenght; i++) {
    for (let j = 0; j < rowLength; j++) {
      console.log(`data[i][j]: ${Number.isNaN(Number(data[i][j]))}`);
      if (!Number.isNaN(Number(data[i][j]))) {
        data[i][j] = Number(data[i][j]);
      } else data[i][j] = "";
    }
  }
  console.log(data);
  return parser.parse(formula, position, true);
};

const parser = new FormulaParser({
  // Variable used in formulas (defined name)
  // Should only return range reference or cell reference
  onVariable: (name, sheetName) => {
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

  // retrieve cell value
  onCell: ({ sheet, row, col }) => {
    // using 1-based index
    // return the cell value, see possible types in next section.
    return data[row - 1][col - 1];
  },

  // retrieve range values
  onRange: (ref) => {
    // using 1-based index
    // Be careful when ref.to.col is MAX_COLUMN or ref.to.row is MAX_ROW, this will result in
    // unnecessary loops in this approach.
    const arr = [];
    for (let row = ref.from.row; row <= ref.to.row; row++) {
      const innerArr = [];
      if (data[row - 1]) {
        for (let col = ref.from.col; col <= ref.to.col; col++) {
          innerArr.push(data[row - 1][col - 1]);
        }
      }
      arr.push(innerArr);
    }
    return arr;
  },
});

export { parserDriver };
