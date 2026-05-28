import { Button } from "primereact/button";

export default function TableHeader(props: any) {
  return (
    <>
      <div className="flex">
        <div className="flex-initial flex align-items-center justify-content-center px-5 py-3">
          <Button icon="pi pi-refresh" rounded raised onClick={props.addColumn}>
            Add Column
          </Button>
        </div>
        <div className="flex-initial flex align-items-center justify-content-center px-5 py-3"></div>
      </div>
    </>
  );
}
