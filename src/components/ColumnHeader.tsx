import { useState, useEffect } from "react";
import { Button } from "primereact/button";

function ColumnHeader(props: any) {
  const [content, setContent] = useState("");

  return (
    <>
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-12">
          <Button icon="pi pi-refresh" onClick={() => props.addColumn()}>
            Add Col
          </Button>
        </div>
        <div className="col-7 md:col-6 lg:col-12">
          <p>{props.columnId}</p>
        </div>
      </div>
    </>
  );
}

export default ColumnHeader;
