import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ColumnHeader from "./ColumnHeader.tsx";
import Cell from "./Cell.tsx";
import { Button } from "primereact/button";
import { nanoid as uuidv4 } from "nanoid";
import * as Y from "yjs";

//-----------------------------Types-----------------------------
type ColumnType = { id: string; positionIndex: number };
type RowType = { id: string; positionIndex: number };
type CellId = {
  colId: string;
  rowId: string;
  colIdxrowId: string;
};
//---------------------------------------------------------------

function SpreadSheet(props: any) {
  const {
    yDoc,
    yMap,
    yColumns,
    yRows,
    undoColumns,
    undoRows,
    yColKeep,
    yRowKeep,
  } = props; //yjs Structures

  //-----------------------------React States-----------------------------
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [rows, setRows] = useState<RowType[]>([]);
  const [columnPositionIndex, setColumnPositionIndex] = useState<number>(0);
  const [rowPositionIndex, setRowPositionIndex] = useState<number>(0);

  //------------------------------------------------------------------------

  //-----------------------------YColumns/YRows Observers-----------------------------
  useEffect(() => {
    const observer = (event: any) => {
      event.changes.delta.forEach(
        (change: { insert: string; delete?: any }, key: any) => {
          if (change.insert !== undefined) {
            let index: number = findYElement(change.insert[0], yColumns);
            for (let i = 0; i < yColumns.length; i++) {
              if (change.insert[0] === yColumns.get(i)) index = i;
            }
            setColumns((columns) => [
              ...columns.slice(0, index),
              { id: change.insert[0], positionIndex: index - 1 },
              ...columns.slice(index),
            ]);
            increaseColumnPositionIndexes(index);
          } else if (change.delete !== undefined) {
            console.log(
              `Property "${key}" was deleted. New value: "${yMap.get(key)}". Previous value: "".`,
            );
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
        (change: { insert: string; delete?: any }, key: any) => {
          if (change.insert !== undefined) {
            let index: number = findYElement(change.insert[0], yRows);
            setRows((rows) => [
              ...rows.slice(0, index),
              {
                id: change.insert[0],
                positionIndex: index - 1,
              },
              ...rows.slice(index),
            ]);
            increaseRowPositionIndexes(index);
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

  const findYElement = (id: string, yStructure: Y.Array<unknown>): number => {
    let index: number = 0;
    for (let i = 0; i < yStructure.length; i++) {
      if (id === yStructure.get(i)) index = i;
    }
    return index;
  };
  //------------------------------------------------------------------------

  useEffect(() => {
    yMap.observe((yMapEvent: any) => {
      yMapEvent.changes.keys; // => Map<string, { action: 'add'|'update'|'delete', oldValue: any}>

      yMapEvent.changes.keys.forEach(
        (change: { action: string; oldValue: any }, key: any) => {
          if (change.action === "add") {
            console.log(
              `Property "${key}" was added. Initial value: "${yMap.get(key)}".`,
            );
          } else if (change.action === "delete") {
            console.log(
              `Property "${key}" was deleted. Previous value: "${change.oldValue}".`,
            );
          }
        },
      );
    });
    /*
    // Keep Map observers. Handle undo of deletion if keep flag was set.
    yColKeep.observe((event) => {
      if (event.transaction.origin) {
        yColKeep.forEach((_, key) => {
          if (yColumns.toArray().indexOf(key) < 0) {
            undoColumns.undo();
          }
        });
        yColKeep.clear();
      }
    });
    yRowKeep.observe((event) => {
      if (event.transaction.origin) {
        yRowKeep.forEach((_, key) => {
          if (yRows.toArray().indexOf(key) < 0) {
            undoRows.undo();
          }
        });
        yRowKeep.clear();
      }
    }); */
    // Undo manager listeners. Filter out insertions, since they do not need to be undone.
    /* undoColumns.on("stack-item-added", () => {
      undoColumns.undoStack.forEach((item, index) => {
        if (item.insertions.clients.size > 0)
          undoColumns.undoStack.splice(index, 1);
      });
    });
    undoRows.on("stack-item-added", () => {
      undoRows.undoStack.forEach((item, index) => {
        if (item.insertions.clients.size > 0)
          undoRows.undoStack.splice(index, 1);
      });
    }); */
  }, []);

  const addColumn = (column: ColumnType, ifAppend: boolean): void => {
    let newColId: string = uuidv4(10);
    let newColIdTempWEmpty: string = newColId.concat(",");

    let index: number = 0;
    if (ifAppend === true) {
      index = yColumns.length;
      setColumnPositionIndex(index + 1);
    } else if (column !== undefined) {
      index = column.positionIndex;
    } else return;

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
  };

  const addRow = (row: RowType, ifAppend: boolean): void => {
    let newRowId: string = uuidv4(10);

    let index: number = 0;
    if (ifAppend === true) {
      index = yRows.length;
      setRowPositionIndex(index + 1);
    } else if (row !== undefined) {
      index = row.positionIndex;
    } else return;

    yRows.insert(index, [newRowId]);

    let ids: CellId[] = [];
    for (let i = 0; i < yRows._length; i++) {
      let colIdTemp: string = yRows.get(i) as string;
      let colIdTempWEmpty: string = colIdTemp.concat(",");
      let cellId: CellId = {
        rowId: newRowId,
        colId: colIdTemp,
        colIdxrowId: colIdTempWEmpty.concat(newRowId.toString()),
      };
      ids.push(cellId);
      yMap.set(cellId.colIdxrowId, "");
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
    }
  }

  function removeRow(row: RowType): void {
    let index: number = row.positionIndex;
    if (yRows.get(index) !== undefined) yRows.delete(index);

    const rowId: string = yRows.get(index) as string;
    if (yRowKeep.has(rowId)) yRowKeep.delete(rowId);
  }

  function decreaseColumnPositionIndexes(startIndex: number): void {
    setColumns((prevColumns) => {
      return prevColumns.map((col, i) => {
        if (i >= startIndex) {
          return { ...col, positionIndex: col.positionIndex - 1 };
        }
        return col;
      });
    });
    setColumnPositionIndex(columnPositionIndex - 1);
  }

  return (
    <>
      <div className="grid">
        <Button
          className="button-spreadsheet-header"
          icon="pi pi-arrow-circle-down"
          text
          onClick={() => addRow(yRows[yRows.length - 1], true)}
        />
        <Button
          className="button-spreadsheet-header"
          icon="pi pi-arrow-circle-right"
          text
          onClick={() => addColumn(yColumns.get(yColumns.length - 1), true)}
        ></Button>

        <div className="col-10"></div>
        <div className="col-12">
          <div className="text-center p-3 border-round-sm bg-primary font-bold">
            <DataTable value={rows} className="spread_sheet">
              {columns.map((columnData: ColumnType) => (
                <Column
                  key={columnData.id}
                  field="content"
                  header={
                    <>
                      <ColumnHeader
                        columnId={columnData.id}
                        column={columnData}
                        addColumn={addColumn}
                        removeColumn={removeColumn}
                      />
                    </>
                  }
                  body={(rowData: RowType) => (
                    <Cell
                      row={rowData}
                      col={columnData}
                      yDoc={yDoc}
                      yMap={yMap}
                      yColumns={yColumns}
                      yRows={yRows}
                      yColKeep={yColKeep}
                      yRowKeep={yRowKeep}
                    />
                  )}
                />
              ))}
              <Column
                body={(rowData: RowType, options) => (
                  <>
                    <Button
                      icon="pi pi-arrow-circle-up"
                      text
                      onClick={() => addRow(rows[options.rowIndex], false)}
                    ></Button>

                    <Button
                      icon="pi pi-minus-circle"
                      text
                      className="remove-button"
                      onClick={() => removeRow(rows[options.rowIndex])}
                    ></Button>
                  </>
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
