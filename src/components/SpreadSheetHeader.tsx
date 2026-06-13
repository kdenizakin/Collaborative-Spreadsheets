import { Button } from "primereact/button";

function SpreadSheetHeader(props: any) {
  function WsButton() {
    if (props.isConnected) {
      return (
        <Button
          data-testid="close-ws-connection-button"
          className="button-spreadsheet-header"
          icon="pi pi-times-circle"
          text
          onClick={() => props.closeWsConnection()}
        >
          {"close websocket connection"}
        </Button>
      );
    }

    return (
      <Button
        data-testid="close-ws-connection-button"
        className="button-spreadsheet-header"
        icon="pi pi-wifi"
        text
        onClick={() => props.reopenWsConnection()}
      >
        {"reopen websocket connection"}
      </Button>
    );
  }

  return (
    <>
      <Button
        data-testid="add-row-button"
        className="button-spreadsheet-header"
        icon="pi pi-arrow-circle-down"
        text
        onClick={() =>
          props.addRow(
            props.generateRandomUid(),
            props.yRows[props.yRows.length - 1],
            true,
          )
        }
      />
      <Button
        data-testid="add-column-button"
        className="button-spreadsheet-header"
        icon="pi pi-arrow-circle-right"
        text
        onClick={() =>
          props.addColumn(
            props.generateRandomUid(),
            props.yColumns.get(props.yColumns.length - 1),
            true,
          )
        }
      ></Button>
      <WsButton></WsButton>
    </>
  );
}

export default SpreadSheetHeader;
