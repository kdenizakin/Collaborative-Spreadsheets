import { useState, useEffect } from "react";
import InputField from "./InputField";

function Cell(props: any) {
  let cellId: string = props.colId.concat(" " + props.rowId);

  const getInitialContent = () => {
    const cellData = props.yMap.get(cellId);
    if (cellData === undefined || cellData.content === undefined) return "";
    return cellData.content.arr;
  };

  const [content, setContent] = useState<string>(getInitialContent());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    props.yMap.set(cellId, e.target.value);
  };

  return (
    <>
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-12">
          <>
            <p>row id: {props.rowId}</p>
            <InputField
              cellContent={content}
              setCellContent={setContent}
              handleChange={handleChange}
            />
            {content}
          </>
        </div>
      </div>
    </>
  );
}

export default Cell;
