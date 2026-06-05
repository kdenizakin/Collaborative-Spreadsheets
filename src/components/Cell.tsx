import { useState } from "react";
import InputField from "./InputField";

type RemoveKeepOperationId = `c${number}.${number}`;

function Cell(props: any) {
  const {
    spreadsheet,
    yDoc,
    yMap,
    yColumns,
    yRows,
    undoColumns,
    undoRows,
    yColKeep,
    yRowKeep,
  } = props;

  let cellId: string = props.col.id.concat(", " + props.row.id);

  const getInitialContent = () => {
    const cellData = props.yMap.get(cellId);
    if (cellData === undefined || cellData.content === undefined) return "";
    return cellData.content.arr;
  };

  const [content, setContent] = useState<string>(getInitialContent());

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    yMap.set(cellId, e.target.value);

    if (e.target.value === "") {
      if (!yMap.has(cellId))
        //if ymap doesn't have that key. Can map and ycols/yrows diverge?
        return;
    }
    yMap.set(cellId, e.target.value);
    let keepId: RemoveKeepOperationId = `c${yDoc.clientID as number}.${1 as number}`;
    yColKeep.set(props.col.id, [keepId]);
    yRowKeep.set(props.row.id, [keepId]);
    const newSpreadsheet = [...spreadsheet];
    newSpreadsheet[props.row.positionIndex][props.col.positionIndex] =
      e.target.value;
    props.setSpreadsheet(newSpreadsheet);

    console.log(yMap);
    console.log(yColumns);
    console.log(yRows);
    console.log(yColKeep);
    console.log(yRowKeep);
  };

  return (
    <>
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-12">
          <>
            <p>row id: {props.row.id}</p>
            <InputField
              cellContent={content}
              setCellContent={setContent}
              handleChange={handleCellChange}
            />
            {content}
          </>
        </div>
      </div>
    </>
  );
}

export default Cell;
