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
    const observer = (yMapEvent: any) => {
      yMapEvent.changes.keys.forEach(
        (change: { action: string; oldValue: any }, key: any) => {
          if (change.action === "update" && cellId === key) {
            if (yMap.get(cellId) === undefined) return;
            if (
              change.oldValue[0].id !== yMap.get(cellId)[0].id &&
              change.oldValue[0].id !==
                yMap.get(cellId)[yMap.get(cellId).length - 1].id
            ) {
              //means there are concurrent cell updates
              yMap.get(cellId).push(change.oldValue[0]);
            }
            let cellFinalContent: string = ""; //when all the concurrent operations are appended to each other (if they exist).

            if (yMap.get(cellId).length > 1) {
              //if there are concurrent operations.
              for (
                let i = 0;
                i < yMap.get(cellId).length &&
                yDoc.clientID !== yMap.get(cellId)[i];
                i++
              )
                cellFinalContent += yMap.get(cellId)[i].content;

              setContent(cellFinalContent as string);
              const firstId = yMap.get(cellId)[0].id;
              yMap.set(cellId, [{ id: firstId, content: cellFinalContent }]);
            } else if (yMap.get(cellId).length == 1) {
              //if there are no concurrent operations
              setContent(yMap.get(key)[0].content);
            }
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
  }, [yMap]);

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if ((e.target.value as string) === (yMap.get(cellId)[0].content as string))
      return;

    let updateWinsSet: CellUpdateWinsType[] =
      yMap.get(cellId).length === 0
        ? []
        : (yMap.get(cellId) as CellUpdateWinsType[]);

    updateWinsSet = deleteSeenEntries(updateWinsSet);
    updateWinsSet = [{ id: yDoc.clientID, content: e.target.value }];
    console.log(updateWinsSet);
    yMap.set(cellId, updateWinsSet);

    let keepId: RemoveKeepOperationId = `c${yDoc.clientID as number}.${1 as number}`;
    let arrayRefOfColKeep: RemoveKeepOperationId[] = yColKeep.get;
    //console.log(`keepId: ${keepId}, colId: ${col.id}, yColKeep: ${yColKeep}`);
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
