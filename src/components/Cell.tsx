import { useEffect, useRef, useState } from "react";
import InputField from "./InputField";

type RemoveKeepOperationId = `c${number}.${number}`;

//this array will be responsible from the update-wins semantics of the cell.
//Foe example, when two concurrent updates are made for the same cell, this array will store both updates and display content accordingly.
//If there are update and delete operations done concurrently, then update operations will win.
type CellUpdateWinsType = {
  id: string;
  content: string;
};

function Cell(props: any) {
  const { row, col, yDoc, yMap, yColKeep, yRowKeep } = props;
  let cellId: string = `${col.id},${row.id}`;

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
            if (yMap.get(cellId).length === 0) return;

            let length: number = yMap.get(cellId).length;
            for (let i = 0; i < length; i++)
              if (
                change.oldValue[0] !== undefined &&
                change.oldValue[0].id !== yMap.get(cellId)[i].id
              )
                //check all the local yMap update wins set entries and compare with the remote changes. If id's of these operations differ then these are concurrent.
                yMap.get(cellId).push(change.oldValue[0]);

            if (yMap.get(cellId).length == 1) {
              //if there are no concurrent operations
              setContent(yMap.get(cellId)[0].content);
              return;
            }

            let cellFinalContent: string = appendConcurrentUpdates();
            setContent(cellFinalContent as string);

            yMap.set(cellId, [
              { id: yMap.get(cellId)[0].id, content: cellFinalContent },
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
  }, [yMap]);

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (
      yMap.get(cellId).length > 0 &&
      (e.target.value as string) === (yMap.get(cellId)[0].content as string)
    )
      return;

    yMap.set(cellId, []);
    yMap.set(cellId, [{ id: yDoc.clientID, content: e.target.value }]);

    let keepId: RemoveKeepOperationId = `c${yDoc.clientID as number}.${1 as number}`;
    yColKeep.set(col.id, [keepId]);
    yRowKeep.set(row.id, [keepId]);
  };

  const appendConcurrentUpdates = (): string => {
    let cellFinalContent: string = ""; //when all the concurrent operations are appended to each other (if they exist).
    //yMap.get(cellId).length > 1 returns true if there are concurrent operations.
    for (
      let i = 0;
      i < yMap.get(cellId).length &&
      yDoc.clientID !== yMap.get(cellId)[i] &&
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
          <InputField cellContent={content} handleChange={handleCellChange} />
        </div>
      </div>
    </>
  );
}

export default Cell;
