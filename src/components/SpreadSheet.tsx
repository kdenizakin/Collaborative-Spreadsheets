import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ColumnHeader from "./ColumnHeader.tsx";
import Cell from "./Cell.tsx";
import { Button } from "primereact/button";
import { nanoid as uuidv4 } from "nanoid";
import * as Y from "yjs";
import SpreadSheetHeader from "./SpreadSheetHeader.tsx";

import {
  useYMapStore,
  useYColumnsStore,
  useYRowsStore,
  useUndoYColumnsStore,
  useUndoYRowsStore,
  useUndoMapStore,
  useYColKeepStore,
  useYRowKeepStore,
  useYAllFormulaCellsStore,
} from "../YjsStore";

//-----------------------------Types-----------------------------
type ColumnType = { id: string; positionIndex: number };
type RowType = { id: string; positionIndex: number };
type CellId = {
  colId: string;
  rowId: string;
  colIdxrowId: string;
};
//---------------------------------------------------------------

//-----------------------------Yjs States-----------------------------
let yColumns = useYColumnsStore.getState().yColumns;
let yRows = useYRowsStore.getState().yRows;
let undoColumns = useUndoYColumnsStore.getState().undoColumns;
let undoRows = useUndoYRowsStore.getState().undoRows;
let undoMap = useUndoMapStore.getState().undoMap;
let yColKeep = useYColKeepStore.getState().yColKeep;
let yRowKeep = useYRowKeepStore.getState().yRowKeep;
let yAllFormulaCells = useYAllFormulaCellsStore.getState().allFormulaCells;
//------------------------------------------------------------------------

//-----------------------------Label Helpers-----------------------------
const getColumnLabel = (index: number): string => {
  let label = "";
  let num = index;
  while (num >= 0) {
    label = String.fromCharCode((num % 26) + 65) + label;
    num = Math.floor(num / 26) - 1;
  }
  return label;
};

const getRowLabel = (index: number): string => {
  return (index + 1).toString();
};
const getColumnIndex = (label: string): number => {
  let index = 0;
  for (let i = 0; i < label.length; i++) {
    index = index * 26 + (label.charCodeAt(i) - 65);
  }
  return index;
};

const compareLabels = (label1: string, label2: string): number => {
  const colIndex1 = getColumnIndex(label1);
  const colIndex2 = getColumnIndex(label2);
  if (colIndex1 < colIndex2) return -1;
  if (colIndex1 > colIndex2) return 1;
  return 0;
};

const findRightIndexForSortedInsert = (yarray: any, value: string) => {
  let left: number = 0;
  let right: number = yarray.length;

  while (left < right) {
    const mid: number = left + Math.floor((right - left) / 2);

    if (yarray[mid] < value) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
};

const parseColumnLabel = (
  // This function takes a column label (eg. A1) and returns the column name and row index.
  label: string,
): { columnName: string; rowIndex: number } => {
  let index = 0;
  for (let i = 0; i < label.length; i++) {
    if (Number.isNaN(Number(label[i]))) {
      index++;
    } else {
      break;
    }
  }
  let columnName = label.substring(0, index);
  let rowIndex = parseInt(label.substring(index));
  return { columnName, rowIndex };
};

const shiftColumnLabelToRight = (label: string): string => {
  const colIndex = getColumnIndex(label);
  const newColIndex = colIndex + 1;
  return getColumnLabel(newColIndex);
};

const shiftAllFormulaColumnLabelsToRight = (formula: string): string => {
  // This takes a formula string (SUM(A1:B2)) and shifts all the column labels to the right (SUM(B1:C2)).
  const operation: string = formula.split("(")[0];
  const formulaRange: string = formula.split("(")[1].split(")")[0];
  const leftBoundary: { columnName: string; rowIndex: number } =
    parseColumnLabel(formulaRange.split(":")[0]);
  const rightBoundary: { columnName: string; rowIndex: number } =
    parseColumnLabel(formulaRange.split(":")[1]);
  const newLeftBoundary: string = shiftColumnLabelToRight(
    leftBoundary.columnName,
  );
  const newRightBoundary: string = shiftColumnLabelToRight(
    rightBoundary.columnName,
  );
  return `${operation}(${newLeftBoundary}${leftBoundary.rowIndex}:${newRightBoundary}${rightBoundary.rowIndex})`;
};

const shiftAllFormulaRowLabelsToDown = (formula: string): string => {
  // This takes a formula string (SUM(A1:B2)) and shifts all the row labels down (SUM(A2:B3)).
  const operation: string = formula.split("(")[0];
  const formulaRange: string = formula.split("(")[1].split(")")[0];
  const leftBoundary: { columnName: string; rowIndex: number } =
    parseColumnLabel(formulaRange.split(":")[0]);
  const rightBoundary: { columnName: string; rowIndex: number } =
    parseColumnLabel(formulaRange.split(":")[1]);
  const newLeftBoundary: string = leftBoundary.columnName;
  const newRightBoundary: string = rightBoundary.columnName;
  return `${operation}(${newLeftBoundary}${leftBoundary.rowIndex + 1}:${newRightBoundary}${rightBoundary.rowIndex + 1})`;
};

//------------------------------------------------------------------------

function SpreadSheet(props: any) {
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [rows, setRows] = useState<RowType[]>([]);
  const [, setColumnPositionIndex] = useState<number>(0);
  const [, setRowPositionIndex] = useState<number>(0);

  const deleteMapEntry = useYMapStore((state) => state.deleteEntry);

  useEffect(() => {
    const observer = (event: any) => {
      event.changes.delta.forEach(
        (change: { insert: string; delete?: any }) => {
          if (change.insert !== undefined) {
            for (let j: number = 0; j < change.insert.length; j++) {
              let index: number = findYArrayElement(change.insert[j], yColumns);
              setColumns((columns) => [
                ...columns.slice(0, index),
                { id: change.insert[j], positionIndex: index - 1 },
                ...columns.slice(index),
              ]);
              increaseColumnPositionIndexes(index);
            }
          }
        },
      );
      const deletedIds = new Set<string>();

      event.changes.deleted.forEach((item: any) => {
        const deletedValues = item.content.getContent() as string[];
        deletedValues.forEach((id) => deletedIds.add(id));
      });

      setColumns((prev) =>
        prev
          .filter((c) => !deletedIds.has(c.id))
          .map((c, i) => ({ ...c, positionIndex: i })),
      );
    };

    yColumns.observe(observer);
    return () => {
      yColumns.unobserve(observer);
    };
  }, [yColumns, columns]);

  useEffect(() => {
    const observer = (event: any) => {
      event.changes.delta.forEach(
        (change: { insert: string; delete?: any }) => {
          if (change.insert !== undefined) {
            for (let i = 0; i < change.insert.length; i++) {
              let index: number = findYArrayElement(change.insert[i], yRows);
              setRows((rows) => [
                ...rows.slice(0, index),
                {
                  id: change.insert[i],
                  positionIndex: index - 1,
                },
                ...rows.slice(index),
              ]);
              increaseRowPositionIndexes(index);
            }
          }
        },
      );
      const deletedIds = new Set<string>();

      event.changes.deleted.forEach((item: any) => {
        const deletedValues = item.content.getContent() as string[];
        deletedValues.forEach((id) => deletedIds.add(id));
      });

      setRows((prev) =>
        prev
          .filter((r) => !deletedIds.has(r.id))
          .map((r, i) => ({ ...r, positionIndex: i })),
      );
    };

    yRows.observe(observer);
    return () => {
      yRows.unobserve(observer);
    };
  }, [yRows, rows]);

  useEffect(() => {
    yColKeep.observe((event: any) => {
      if (event.transaction.origin) {
        yColKeep.forEach((_: any, key: string) => {
          if (yColumns.toArray().indexOf(key) < 0) {
            undoColumns.undo();
            undoMap.undo();
          }
        });
        yColKeep.clear();
      }
    });

    yRowKeep.observe((event: any) => {
      if (event.transaction.origin) {
        yRowKeep.forEach((_: any, key: string) => {
          if (yRows.toArray().indexOf(key) < 0) {
            undoRows.undo();
            undoMap.undo();
          }
        });
        yRowKeep.clear();
      }
    });

    undoColumns.on("stack-item-added", () => {
      undoColumns.undoStack.forEach((item: any, index: any) => {
        if (item.insertions.clients.size > 0)
          undoColumns.undoStack.splice(index, 1);
      });
    });

    undoRows.on("stack-item-added", () => {
      undoRows.undoStack.forEach((item: any, index: any) => {
        if (item.insertions.clients.size > 0)
          undoRows.undoStack.splice(index, 1);
      });
    });
  }, []);

  const generateRandomUid = (): string => uuidv4(10);

  const findYArrayElement = (id: string, yArray: Y.Array<string>): number => {
    let index: number = 0;
    for (let i = 0; i < yArray.length; i++) {
      if (id === (yArray.get(i) as string)) index = i;
    }
    return index;
  };

  const checkIfFormulaRangeUpdateNecessary = (
    addedElement: string,
    currentElementIdx: number,
  ): boolean => {
    if (addedElement === "row") {
      let currentRowId: string = `${currentElementIdx}`;
      let temp: string = yAllFormulaCells
        .get(0)
        .formula.split("(")[1]
        .split(")")[0]
        .split(":")[0]
        .replace(/[^0-9]/g, "");

      if (
        yAllFormulaCells.length > 0 &&
        parseInt(
          yAllFormulaCells
            .get(0)
            .formula.split("(")[1]
            .split(")")[0]
            .split(":")[0]
            .replace(/[^0-9]/g, ""),
        ) < parseInt(currentRowId)
      ) {
        return true;
      }
    } else if (addedElement === "col") {
      let currentColId: string = `${getColumnLabel(currentElementIdx)}`;
      if (
        yAllFormulaCells.length > 0 &&
        compareLabels(
          currentColId, //eg. A
          parseColumnLabel(
            yAllFormulaCells
              .get(0)
              .formula.split("(")[1]
              .split(")")[0]
              .split(":")[0],
          ).columnName,
        ) <= 0
      ) {
        return true;
      }
    }
    return false;
  };

  const updateFormulaRanges = (
    addedElement: string,
    currentElementIdx: number,
  ) => {
    //if the new column is added after the last formula cell, then no need to shift any formula cells.
    if (addedElement === "row") {
      let currentRowId: string = `${currentElementIdx + 1}`;
      let rightIndexForShift: number = findRightIndexForSortedInsert(
        yAllFormulaCells,
        currentRowId,
      );
      for (let i = rightIndexForShift; i < yAllFormulaCells.length; i++) {
        let newFormulaTemp: string = shiftAllFormulaRowLabelsToDown(
          yAllFormulaCells.get(i).formula,
        );
        let cellId: string = yAllFormulaCells.get(i).cellId;
        yAllFormulaCells.delete(i);
        yAllFormulaCells.insert(i, [
          { cellId: cellId, formula: newFormulaTemp },
        ]);
      }
    } else if (addedElement === "col") {
      let currentColId: string = `${getColumnLabel(currentElementIdx)}`;
      let rightIndexForShift: number = findRightIndexForSortedInsert(
        yAllFormulaCells,
        currentColId,
      );
      for (let i = rightIndexForShift; i < yAllFormulaCells.length; i++) {
        let newFormulaTemp: string = shiftAllFormulaColumnLabelsToRight(
          yAllFormulaCells.get(i).formula,
        );
        let cellId: string = yAllFormulaCells.get(i).cellId;
        yAllFormulaCells.delete(i);
        yAllFormulaCells.insert(i, [
          { cellId: cellId, formula: newFormulaTemp },
        ]);
      }
    }
  };

  const addColumn = (
    colId: string,
    column: ColumnType,
    ifAppend: boolean,
  ): void => {
    let newColId: string = colId;
    let index: number = 0;
    if (ifAppend === true) {
      index = yColumns.length;
      setColumnPositionIndex(index + 1);
    } else if (column !== undefined) {
      index = column.positionIndex;
    } else return;

    yColumns.insert(index, [newColId]);
    let setYmapEntry = useYMapStore.getState().setEntry;
    for (let i = 0; i < yRows.length; i++) {
      let rowIdTemp: string = yRows.get(i) as string;
      let cellId: CellId = {
        rowId: rowIdTemp,
        colId: newColId,
        colIdxrowId: `${newColId},${rowIdTemp}`,
      };
      setYmapEntry(cellId.colIdxrowId, "");
    }

    let shouldUpdateFormulaRanges: boolean = checkIfFormulaRangeUpdateNecessary(
      "col",
      index,
    );

    if (shouldUpdateFormulaRanges) {
      updateFormulaRanges("col", index);
    }
  };

  const addRow = (rowId: string, row: RowType, ifAppend: boolean): void => {
    let newRowId: string = rowId;
    let index: number = 0;
    if (ifAppend === true) {
      index = yRows.length;
      setRowPositionIndex(index + 1);
    } else if (row !== undefined) {
      index = row.positionIndex;
    } else return;

    yRows.insert(index, [newRowId]);

    let ids: CellId[] = [];
    const setYmapEntry = useYMapStore.getState().setEntry;

    for (let i = 0; i < yColumns.length; i++) {
      let colIdTemp: string = yColumns.get(i) as string;
      let cellId: CellId = {
        rowId: newRowId,
        colId: colIdTemp,
        colIdxrowId: `${colIdTemp},${newRowId}`,
      };
      ids.push(cellId);
      setYmapEntry(cellId.colIdxrowId, "");
    }

    let shouldUpdateFormulaRanges: boolean = checkIfFormulaRangeUpdateNecessary(
      "row",
      index,
    );

    if (shouldUpdateFormulaRanges) {
      updateFormulaRanges("row", index);
    }
  };

  function increaseColumnPositionIndexes(startIndex: number): void {
    setColumns((prevColumns) => {
      return prevColumns.map((col, i) => {
        if (i >= startIndex) {
          return { ...col, positionIndex: col.positionIndex + 1 };
        }
        return col;
      });
    });
  }

  function increaseRowPositionIndexes(startIndex: number): void {
    setRows((prevRows) => {
      return prevRows.map((row, i) => {
        if (i >= startIndex) {
          return { ...row, positionIndex: row.positionIndex + 1 };
        }
        return row;
      });
    });
  }

  function removeColumn(column: ColumnType): void {
    let index: number = column.positionIndex;
    const colId: string = yColumns.get(index) as string;
    if (yColKeep.has(colId)) {
      yColKeep.delete(colId);
    }
    if (yColumns.get(index) !== undefined) {
      yColumns.delete(index);
      for (let i = 0; i < yRows.length; i++) {
        let colIdTemp: string = column.id;
        let rowIdTemp: string = yRows.get(i);
        let cellIdTemp: string = `${colIdTemp},${rowIdTemp}`;
        deleteMapEntry(cellIdTemp);
      }
    }
  }

  function removeRow(row: RowType): void {
    let index: number = row.positionIndex;
    if (yRows.get(index) !== undefined) {
      yRows.delete(index);
      for (let i = 0; i < yColumns.length; i++) {
        let colIdTemp: string = yColumns.get(i);
        let rowIdTemp: string = row.id;
        let cellIdTemp: string = `${colIdTemp},${rowIdTemp}`;
        deleteMapEntry(cellIdTemp);
      }
    }
    const rowId: string = yRows.get(index) as string;
    if (yRowKeep.has(rowId)) yRowKeep.delete(rowId);
  }

  return (
    <>
      <div className="grid">
        <SpreadSheetHeader
          isConnected={props.isConnected}
          setIsConnected={props.setIsConnected}
          closeWsConnection={props.closeWsConnection}
          reopenWsConnection={props.reopenWsConnection}
          addRow={addRow}
          addColumn={addColumn}
          generateRandomUid={generateRandomUid}
          yRows={yRows}
          yColumns={yColumns}
        />

        <div className="col-10"></div>
        <div className="col-12">
          <div className="text-center p-3 border-round-sm bg-primary font-bold">
            <DataTable
              key={columns.length}
              value={rows}
              dataKey="id"
              className="spread_sheet"
            >
              <Column
                header="#"
                style={{ width: "3.5rem" }}
                bodyStyle={{
                  verticalAlign: "middle",
                  textAlign: "center",
                }}
                body={(_, options) => (
                  <div className="sheet-row-mark">
                    {getRowLabel(options.rowIndex)}
                  </div>
                )}
              />

              {columns.map((columnData: ColumnType, colIdx: number) => (
                <Column
                  data-testid="column"
                  key={columnData.id}
                  field="content"
                  header={
                    <div
                      data-testid="column-header"
                      className="sheet-column-heading"
                    >
                      <span className="sheet-column-mark">
                        {getColumnLabel(colIdx)}
                      </span>

                      <div className="sheet-column-buttons">
                        <ColumnHeader
                          column={columnData}
                          generateRandomUid={generateRandomUid}
                          addColumn={addColumn}
                          removeColumn={removeColumn}
                        />
                      </div>
                    </div>
                  }
                  bodyStyle={{ verticalAlign: "middle" }}
                  body={(rowData: RowType) => (
                    <div className="sheet-cell-content">
                      <Cell
                        key={`${columnData.id},${rowData.id}`}
                        row={rowData}
                        col={columnData}
                        getColumnLabel={getColumnLabel}
                      />
                    </div>
                  )}
                />
              ))}

              <Column
                bodyStyle={{ verticalAlign: "middle" }}
                body={(rowData: RowType, options) => (
                  <div className="sheet-row-buttons">
                    <Button
                      icon="pi pi-arrow-circle-up"
                      text
                      onClick={() =>
                        addRow(
                          generateRandomUid(),
                          rows[options.rowIndex],
                          false,
                        )
                      }
                    />

                    <Button
                      icon="pi pi-minus-circle"
                      text
                      className="remove-button"
                      onClick={() => removeRow(rows[options.rowIndex])}
                    />
                  </div>
                )}
              />
            </DataTable>
          </div>
        </div>
      </div>
    </>
  );
}

export default SpreadSheet;
