import { useEffect, useRef, useState } from "react";
import InputField from "./InputField";

type RemoveKeepOperationId = `c${number}.${number}`;

function Cell(props: any) {
  const { row, col, yDoc, yMap, yColKeep, yRowKeep } = props;
  let cellId: string = `${col.id},${row.id}`;

  const getInitialContent = () => {
    const cellData: string = props.yMap.get(cellId);
    if (cellData === undefined) return "";
    return cellData;
  };

  const [content, setContent] = useState<string>(getInitialContent());

  useEffect(() => {
    yMap.observe((yMapEvent: any) => {
      yMapEvent.changes.keys.forEach(
        (change: { action: string; oldValue: any }, key: any) => {
          if (change.action === "update" && cellId === key) {
            setContent(yMap.get(key));
          } else if (
            change.action === "add" &&
            cellId === key &&
            yMap.get(key) !== ""
          ) {
            setContent(yMap.get(key));
          }
        },
      );
    });
  }, []);

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let colIdx: number = col.positionIndex;
    let rowIdx: number = row.positionIndex;

    if ((e.target.value as string) === yMap.get(cellId)) {
      return;
      /*  if (!yMap.has(cellId))
        //if ymap doesn't have that key. Can map and ycols/yrows diverge? */
    }
    yMap.set(cellId, e.target.value as string);

    let keepId: RemoveKeepOperationId = `c${yDoc.clientID as number}.${1 as number}`;
    let arrayRefOfColKeep: RemoveKeepOperationId[] = yColKeep.get;
    console.log(`keepId: ${keepId}, colId: ${col.id}, yColKeep: ${yColKeep}`);
    yColKeep.set(col.id, [keepId]);
    yRowKeep.set(row.id, [keepId]);
  };

  useEffect(() => {
    setContent(yMap.get(cellId) as string);
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
