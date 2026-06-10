import { Button } from "primereact/button";

function SpreadSheetHeader(props: any) {
  return (
    <>
      <Button
        data-testid="add-row-button"
        className="button-spreadsheet-header"
        icon="pi pi-arrow-circle-down"
        text
        onClick={() => props.addRow(props.yRows[props.yRows.length - 1], true)}
      />
      <Button
        data-testid="add-column-button"
        className="button-spreadsheet-header"
        icon="pi pi-arrow-circle-right"
        text
        onClick={() =>
          props.addColumn(props.yColumns.get(props.yColumns.length - 1), true)
        }
      ></Button>
    </>
  );
}

export default SpreadSheetHeader;
