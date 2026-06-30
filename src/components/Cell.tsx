import { useEffect, useRef, useState } from "react";
import InputField from "./InputField";
import { nanoid as uuidv4 } from "nanoid";

type RemoveKeepOperationId = `c${number}.${number}`;
type CellUpdateWinsType = {
  id: string;
  content: string;
};

function Cell(props: any) {
  const { row, col, yDoc, yMap, yColKeep, yRowKeep } = props;
  let cellId: string = `${col.id},${row.id}`;

  const cell_update_wins: CellUpdateWinsType[] = []; //this array will be responsible from the update-wins semantics of the cell.
  //Foe example, when two concurrent updates are made for the same cell, this array will store both updates and display content accordingly.
  //If there are update and delete operations done concurrently, then update operations will win.

  const getInitialContent = () => {
    const cellData: CellUpdateWinsType[] = props.yMap.get(cellId);
    if (cellData === undefined || cellData[0] === undefined) return "";
    return cellData[0].content;
  };

  const [content, setContent] = useState<string>(getInitialContent());

  useEffect(() => {
    yMap.observe((yMapEvent: any) => {
      yMapEvent.changes.keys.forEach(
        (change: { action: string; oldValue: any }, key: any) => {
          if (change.action === "update" && cellId === key) {
            let cellFinalContent: string = ""; //when all the concurrent operations are appended to each other (if they exist).
            if (yMap.get(cellId) === undefined) return;
            console.log(yMap.get(cellId));
            if (yMap.get(cellId).length > 1) {
              //if there are concurrent operations.

              for (let i = 0; i < yMap.get(cellId).length; i++) {
                cellFinalContent += yMap.get(cellId)[i].content;
              }
              setContent(cellFinalContent as string);
            } else if (yMap.get(cellId).length == 1) {
              //if there are no concurrent operations
              setContent(yMap.get(key)[0].content);
            }
          } else if (
            change.action === "add" &&
            cellId === key &&
            yMap.get(key).length === 1
          ) {
            setContent(yMap.get(key)[0].content);
          }
        },
      );
    });
  }, []);

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
<<<<<<< HEAD
    if ((e.target.value as string) === yMap.get(cellId)) return;

    yMap.set(cellId, e.target.value as string);

    let keepId: RemoveKeepOperationId = `c${yDoc.clientID as number}.${1 as number}`;
    console.log(`keepId: ${keepId}, colId: ${col.id}, yColKeep: ${yColKeep}`);
=======
    console.log("here");
    let colIdx: number = col.positionIndex;
    let rowIdx: number = row.positionIndex;

    if ((e.target.value as string) === yMap.get(cellId)) {
      return;
      /*  if (!yMap.has(cellId))
        //if ymap doesn't have that key. Can map and ycols/yrows diverge? */
    }

    let updateWinsSet: CellUpdateWinsType[] =
      yMap.get(cellId).length === 0
        ? []
        : (yMap.get(cellId) as CellUpdateWinsType[]);

    //updateWinsSet = deleteSeenEntries(updateWinsSet);

    updateWinsSet.push({ id: uuidv4(10), content: e.target.value });
    yMap.set(cellId, updateWinsSet);

    let keepId: RemoveKeepOperationId = `c${yDoc.clientID as number}.${1 as number}`;
    let arrayRefOfColKeep: RemoveKeepOperationId[] = yColKeep.get;
    //console.log(`keepId: ${keepId}, colId: ${col.id}, yColKeep: ${yColKeep}`);
>>>>>>> cf0ace5 (Implementation for cell update wins (not working currently))
    yColKeep.set(col.id, [keepId]);
    yRowKeep.set(row.id, [keepId]);
  };

  //this function applies update-wins semantcis. It deletes seen entries from the cell content. It cannot delete an entry (concurrent for example)
  //if it does see the id. With this way concurrent updates of the cell content are preserved.
  let deleteSeenEntries = (
    updateWinsArray: CellUpdateWinsType[],
  ): CellUpdateWinsType[] => {
    let length: number = updateWinsArray.length;
    for (let i = 0; i < length; i++) {
      //in the mean time there might be a concurrent operation. However, they are also preserved with this approach.
      updateWinsArray = [...updateWinsArray.slice(1)] as CellUpdateWinsType[];
    }
    return updateWinsArray;
  };

  useEffect(() => {
    setContent("");
  }, [yMap]);

  return (
    <>
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-12">
          <p>row id: {props.row.id}</p>
          <InputField cellContent={content} handleChange={handleCellChange} />
          {content}
        </div>
      </div>
    </>
  );
}

export default Cell;
