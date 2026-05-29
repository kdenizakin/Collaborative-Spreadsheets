import { useState, useEffect } from "react";
import { Button } from "primereact/button";

function ColumnHeader(props: any) {
  return (
    <>
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-12">
          <Button
            icon="pi pi-arrow-circle-left"
            text
            onClick={() => props.addColumn()}
          ></Button>
        </div>
        <div className="col-7 md:col-6 lg:col-12">
          <p>{props.columnId}</p>
        </div>
      </div>
    </>
  );
}

export default ColumnHeader;
