import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import InputField from "./InputField.tsx";
import ColumnHeader from "./ColumnHeader.tsx";
import { Button } from "primereact/button";
import { WebsocketProvider } from "y-websocket";
import { nanoid as uuidv4 } from "nanoid";
import * as Y from "yjs";

type ColumnType = { id: string; content: string; positionIndex: number };
type RowType = { id: string; content: any; positionIndex: number };

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
    console.log("here");
    let newColId: string = uuidv4(10);
    let newColIdTempWEmpty: string = newColId.concat(" ");
    yColumns.push([newColId]);

    let ids: CellId[] = [];
    for (let i = 0; i < yRows._length; i++) {
      // row id is fixesd, we need col ids
      let rowIdTemp: string = yRows.get(i) as string;
      let rowIdTempWEmpty: string = rowIdTemp.concat(" ");
      let cellId: CellId = {
        rowId: rowIdTemp,
        colId: newColId,
        colIdxrowId: newColIdTempWEmpty.concat(rowIdTempWEmpty),
      };
      ids.push(cellId);
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

    let ids: CellId[] = [];
    for (let i = 0; i < yColumns._length; i++) {
      // row id is fixesd, we need col ids
      let colIdTemp: string = yColumns.get(i) as string;
      let colIdTempWEmpty: string = colIdTemp.concat(" ");
      let cellId: CellId = {
        colId: colIdTemp,
        rowId: newRowId,
        colIdxrowId: colIdTempWEmpty.concat(newRowId.toString()),
      };
      ids.push(cellId);
      yMap.set(cellId.colIdxrowId, "");
    }
    setRows((rows) => [
      ...rows,
      {
        id: newRowId,
        content: (
          <>
            <p>row id: {newRowId}</p>
            <InputField />
          </>
        ),
        positionIndex: 0,
      },
    ]);
  };

  const addColumn = (column: ColumnType): void => {
    let newColId: string = uuidv4(10);
    let newColIdTempWEmpty: string = newColId.concat(" ");
    let index: number = column.positionIndex;
    yColumns.insert(index, [newColId]);

    let ids: CellId[] = [];
    for (let i = 0; i < yRows._length; i++) {
      let rowIdTemp: string = yRows.get(i) as string;
      let cellId: CellId = {
        rowId: rowIdTemp,
        colId: newColId,
        colIdxrowId: newColIdTempWEmpty.concat(rowIdTemp.toString()),
      };
      ids.push(cellId);
      yMap.set(cellId.colIdxrowId, "");
    }
    console.log(ids);
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
    console.log(index);
    setColumns((columns) => [
      ...columns.slice(0, index),
      { id: newColId, content: "col", positionIndex: index - 1 },
      ...columns.slice(index),
    ]);

    updateColumnPositions(index);
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
        <div className="col-1"></div>
        <div className="col-1">
          <div className="text-center p-1 border-round-sm bg-primary font-bold">
            <Button icon="pi pi-refresh" raised onClick={appendColumn}>
              Add Column
            </Button>
          </div>
        </div>
        <div className="col-1">
          <div className="text-center p-1 border-round-sm bg-primary font-bold">
            <Button icon="pi pi-refresh" raised onClick={appendRow}>
              Add Row
            </Button>
          </div>
        </div>
        <div className="col-9"></div>
        <div className="col-11">
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
                />
              ))}
            </DataTable>
          </div>
        </div>
      </div>
    </>
  );
}

export default SpreadSheet;
