import { Button } from "primereact/button";

function ColumnHeader(props: any) {
  return (
    <>
      <div className="grid">
        <Button
          icon="pi pi-arrow-circle-left"
          text
          onClick={() =>
            props.addColumn(props.generateRandomUid(), props.column, false)
          }
        ></Button>
        <Button
          icon="pi pi-minus-circle"
          text
          className="remove-button"
          onClick={() => props.removeColumn(props.column)}
        ></Button>
        <div className="col-7 md:col-6 lg:col-12">
          <p>{props.columnId}</p>
        </div>
      </div>
    </>
  );
}

export default ColumnHeader;
