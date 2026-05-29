import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ColumnHeader from "./ColumnHeader.tsx";
import Cell from "./Cell.tsx";
import { Button } from "primereact/button";
import { WebsocketProvider } from "y-websocket";
import { nanoid as uuidv4 } from "nanoid";
import * as Y from "yjs";

type ColumnType = { id: string; content: string; positionIndex: number };
type RowType = { id: string; positionIndex: number };

const yDoc = new Y.Doc();

//const wsProvider = new WebsocketProvider('ws://localhost:1234', 'removeKeep', yDoc);
//const [connectionStatus, setConnectionStatus] = useState('');

const yMap = yDoc.getMap("spreadsheet");
type CellId = {
  colId: string;
  rowId: string;
  colIdxrowId: string;
};

/* const yColKeep = yDoc.getMap("column-keep");
const yRowKeep = yDoc.getMap("row-keep"); */

function SpreadSheet() {
  const yColumns: Y.Array<unknown> = yDoc.getArray("columns");
  const yRows = yDoc.getArray("rows");

  /* const undoColumns = new Y.UndoManager(yColumns);
  const undoRows = new Y.UndoManager(yRows); */

  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [rows, setRows] = useState<RowType[]>([]);

  const [columnPositionIndex, setColumnPositionIndex] = useState<number>(0);
  const [rowPositionIndex, setRowPositionIndex] = useState<number>(0);

  const appendColumn = (): void => {
    let newColId: string = uuidv4(10);
    let newColIdTempWEmpty: string = newColId.concat(" ");
    yColumns.push([newColId]);

    for (let i = 0; i < yRows._length; i++) {
      // row id is fixesd, we need col ids
      let rowIdTemp: string = yRows.get(i) as string;
      let rowIdTempWEmpty: string = rowIdTemp.concat(" ");
      let cellId: CellId = {
        rowId: rowIdTemp,
        colId: newColId,
        colIdxrowId: newColIdTempWEmpty.concat(rowIdTempWEmpty),
      };
      yMap.set(cellId.colIdxrowId, "");
    }

    setColumns((cols) => [
      ...cols,
      { id: newColId, content: "col", positionIndex: columnPositionIndex },
    ]);
    setColumnPositionIndex(columnPositionIndex + 1);
  };

  const appendRow = (): void => {
    let newRowId: string = uuidv4(10);
    yRows.push([newRowId]);

    for (let i = 0; i < yColumns._length; i++) {
      // row id is fixesd, we need col ids
      let colIdTemp: string = yColumns.get(i) as string;
      let colIdTempWEmpty: string = colIdTemp.concat(" ");
      let cellId: CellId = {
        colId: colIdTemp,
        rowId: newRowId,
        colIdxrowId: colIdTempWEmpty.concat(newRowId.toString()),
      };
      yMap.set(cellId.colIdxrowId, "");
    }
    setRows((rows) => [
      ...rows,
      {
        id: newRowId,
        positionIndex: rowPositionIndex,
      },
    ]);
    setRowPositionIndex(rowPositionIndex + 1);
  };

  const addColumn = (column: ColumnType): void => {
    let newColId: string = uuidv4(10);
    let newColIdTempWEmpty: string = newColId.concat(" ");
    let index: number = column.positionIndex;
    yColumns.insert(index, [newColId]);

    for (let i = 0; i < yRows._length; i++) {
      let rowIdTemp: string = yRows.get(i) as string;
      let cellId: CellId = {
        rowId: rowIdTemp,
        colId: newColId,
        colIdxrowId: newColIdTempWEmpty.concat(rowIdTemp.toString()),
      };
      yMap.set(cellId.colIdxrowId, "");
    }
    console.log(yMap);
    setColumns((columns) => [
      ...columns.slice(0, index),
      { id: newColId, content: "col", positionIndex: index - 1 },
      ...columns.slice(index),
    ]);

    updateColumnPositions(index);
  };

  const addRow = (row: RowType): void => {
    let newRowId: string = uuidv4(10);
    let index: number = row.positionIndex;
    yRows.insert(index, [newRowId]);
    let ids: CellId[] = [];
    for (let i = 0; i < yRows._length; i++) {
      let colIdTemp: string = yRows.get(i) as string;
      let colIdTempWEmpty: string = colIdTemp.concat(" ");
      let cellId: CellId = {
        rowId: newRowId,
        colId: colIdTemp,
        colIdxrowId: colIdTempWEmpty.concat(newRowId.toString()),
      };
      ids.push(cellId);
      yMap.set(cellId.colIdxrowId, "");
    }
    setRows((rows) => [
      ...rows.slice(0, index),
      {
        id: newRowId,
        positionIndex: index - 1,
      },
      ...rows.slice(index),
    ]);
    updateRowPositions(index);
  };

  function updateColumnPositions(startIndex: number): void {
    setColumns((prevColumns) => {
      return prevColumns.map((col, i) => {
        if (i >= startIndex) {
          return { ...col, positionIndex: col.positionIndex + 1 };
        }
        return col;
      });
    });
  }

  function updateRowPositions(startIndex: number): void {
    setRows((prevRows) => {
      return prevRows.map((row, i) => {
        if (i >= startIndex) {
          return { ...row, positionIndex: row.positionIndex + 1 };
        }
        return row;
      });
    });
  }

  return (
    <>
      <div className="grid">
        <Button
          className="button-spreadsheet-header"
          icon="pi pi-arrow-circle-right"
          text
          onClick={appendColumn}
        ></Button>
        <Button
          className="button-spreadsheet-header"
          icon="pi pi-arrow-circle-down"
          text
          onClick={appendRow}
        />

        <div className="col-10"></div>
        <div className="col-12">
          <div className="text-center p-3 border-round-sm bg-primary font-bold">
            <DataTable value={rows} className="spread_sheet">
              {columns.map((column: ColumnType) => (
                <Column
                  key={column.id}
                  field="content"
                  header={
                    <>
                      <ColumnHeader
                        columnId={column.id}
                        addColumn={() => addColumn(column)}
                      />
                    </>
                  }
                  body={(rowData) => (
                    <Cell
                      initialValue={rowData[column.id]}
                      rowId={rowData.id}
                      colId={column.id}
                      yMap={yMap}
                    />
                  )}
                />
              ))}
              <Column
                body={(rowData, options) => (
                  <Button
                    icon="pi pi-arrow-circle-up"
                    className="button-spreadsheet-header"
                    text
                    onClick={() => addRow(rows[options.rowIndex])}
                  ></Button>
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
