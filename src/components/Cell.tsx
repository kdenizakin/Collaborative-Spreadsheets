import { useEffect, useRef, useState } from "react";
import InputField from "./InputField";
import {
  useYDocStore,
  useYMapStore,
  useYColumnsStore,
  useYRowsStore,
  useUndoYColumnsStore,
  useUndoYRowsStore,
  useUndoMapStore,
  useYColKeepStore,
  useYRowKeepStore,
} from "../YjsStore";

type RemoveKeepOperationId = `c${number}.${number}`;

//this array will be responsible from the update-wins semantics of the cell.
//Foe example, when two concurrent updates are made for the same cell, this array will store both updates and display content accordingly.
//If there are update and delete operations done concurrently, then update operations will win.
type CellUpdateWinsType = {
  id: string;
  content: string;
};

function Cell(props: any) {
  const { row, col, handleFormula } = props;

  //-----------------------------Yjs States-----------------------------
  const YDoc = useYDocStore.getState().YDoc;
  const yMap = useYMapStore.getState().yMap;
  const yColumns = useYColumnsStore.getState().yColumns;
  const yRows = useYRowsStore.getState().yRows;
  const undoColumns = useUndoYColumnsStore.getState().undoColumns;
  const undoRows = useUndoYRowsStore.getState().undoRows;
  const undoMap = useUndoMapStore.getState().undoMap;
  const yColKeep = useYColKeepStore.getState().yColKeep;
  const yRowKeep = useYRowKeepStore.getState().yRowKeep;

  //------------------------------------------------------------------------

  let cellId: string = `${col.id},${row.id}`;
  let rowIdx: number = row.positionIndex;
  let colIdx: number = col.positionIndex;

  const getInitialContent = () => {
    let cellData: CellUpdateWinsType[] = [];
    if (useYMapStore.getState().yMap !== undefined)
      cellData = useYMapStore.getState().yMap.get(cellId);
    if (cellData === undefined || cellData[0] === undefined) return "";
    return cellData[0].content;
  };

  const [content, setContent] = useState<string>(getInitialContent());

  useEffect(() => {
    const setYmapEntry = useYMapStore.getState().setEntry;

    const observer = (yMapEvent: any) => {
      yMapEvent.changes.keys.forEach(
        (change: { action: string; oldValue: any }, key: any) => {
          if (change.action === "update" && cellId === key) {
            if (yMap.get(cellId).length === 0) return;

            let length: number = yMap.get(cellId).length;
            for (let i = 0; i < length; i++)
              if (
                change.oldValue[0] !== undefined &&
                change.oldValue[0].id !== yMap.get(cellId)[i].id
              ) {
                //only enters here if there are concurrent operations on the same cell.
                //check all the local yMap update wins set entries and compare with the remote changes. If id's of these operations differ then these are concurrent.
                yMap.get(cellId).push(change.oldValue[0]);
              }

            if (yMap.get(cellId).length == 1) {
              //if there are no concurrent operations
              setContent(yMap.get(cellId)[0].content);
              return;
            }

            let cellFinalContent: string = appendConcurrentUpdates();
            setContent(cellFinalContent as string);
            setYmapEntry(cellId, [
              {
                id: yMap.get(cellId)[0].id,
                content: cellFinalContent,
              },
            ]);
          } else if (
            change.action === "add" &&
            cellId === key &&
            yMap.get(key).length === 1
          )
            setContent(yMap.get(key)[0].content);
        },
      );
    };
    yMap.observe(observer);
    return () => {
      yMap.unobserve(observer);
    };
  }, [useYMapStore.getState()]);

  const handleFocusOut = (e: React.ChangeEvent<HTMLInputElement>) => {
    const setYmapEntry = useYMapStore.getState().setEntry;
    //we should first check if the given text is a formula or not.
    const formulaPattern = /[A-Z]+\([A-Z*][0-9]+:[A-Z*][0-9]+\)/;
    const isValidFormula = formulaPattern.test(e.target.value as string);
    if (isValidFormula) {
      console.log(`formula qualified ${e.target.value}`);
      handleFormula(e.target.value as string, {
        row: rowIdx,
        col: colIdx,
        sheetName: "spreadsheet",
      });
    }
    if (
      yMap.get(cellId).length > 0 &&
      (e.target.value as string) === (yMap.get(cellId)[0].content as string)
    )
      return;

    setYmapEntry(cellId, []);
    setYmapEntry(cellId, [{ id: YDoc.clientID, content: e.target.value }]);

    let keepId: RemoveKeepOperationId = `c${YDoc.clientID as number}.${1 as number}`;
    yColKeep.set(col.id, [keepId]);
    yRowKeep.set(row.id, [keepId]);
  };

  const appendConcurrentUpdates = (): string => {
    let cellFinalContent: string = ""; //when all the concurrent operations are appended to each other (if they exist).
    //yMap.get(cellId).length > 1 returns true if there are concurrent operations.
    for (
      let i = 0;
      i < yMap.get(cellId).length &&
      YDoc.clientID !== yMap.get(cellId)[i] &&
      yMap.get(cellId).length > 1;
      i++
    )
      cellFinalContent += yMap.get(cellId)[i].content;
    return cellFinalContent;
  };

  return (
    <>
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-12">
          <InputField
            cellContent={content}
            handleFocusOut={handleFocusOut}
            setContent={setContent}
          />
        </div>
      </div>
    </>
  );
}

export default Cell;
