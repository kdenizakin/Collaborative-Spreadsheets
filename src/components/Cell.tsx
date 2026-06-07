import { useEffect, useState } from "react";
import InputField from "./InputField";

type RemoveKeepOperationId = `c${number}.${number}`;

function Cell(props: any) {
  const {
    row,
    col,
    yDoc,
    yMap,
    yColumns,
    yRows,
    undoColumns,
    undoRows,
    yColKeep,
    yRowKeep,
  } = props;
  let cellId: string = props.col.id.concat("," + props.row.id);

  const getInitialContent = () => {
    const cellData = props.yMap.get(cellId);
    if (cellData === undefined || cellData.content === undefined) return "";
    return cellData.content.arr;
  };

  const [content, setContent] = useState<string>(getInitialContent());

  useEffect(() => {
    yMap.observe((yMapEvent: any) => {
      yMapEvent.changes.keys.forEach(
        (change: { action: string; oldValue: any }, key: any) => {
          if (change.action === "update" && cellId === key) {
            console.log(
              `Property "${key}" was updated. New value: "${yMap.get(key)}". Previous value: "${change.oldValue}".`,
            );
            setContent(yMap.get(key));
          } else if (
            change.action === "add" &&
            cellId === key &&
            yMap.get(key) !== ""
          ) {
            console.log(
              `Property "${key}" was updated. New value: "${yMap.get(key)}". Previous value: "${change.oldValue}".`,
            );
            setContent(yMap.get(key));
          }
        },
      );
    });
  }, []);

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let colIdx: number = col.positionIndex;
    let rowIdx: number = row.positionIndex;

    if (e.target.value === "" || e.target.value === yMap.get(cellId)) {
      return;
      /*  if (!yMap.has(cellId))
        //if ymap doesn't have that key. Can map and ycols/yrows diverge? */
    }
    yMap.set(cellId, e.target.value);

    let keepId: RemoveKeepOperationId = `c${yDoc.clientID as number}.${1 as number}`;
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
          <>
            <p>row id: {props.row.id}</p>
            <InputField cellContent={content} handleChange={handleCellChange} />
            {content}
          </>
        </div>
      </div>
    </>
  );
}

export default Cell;
