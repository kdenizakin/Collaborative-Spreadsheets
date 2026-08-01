function InputField(props: any) {
  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.setContent(e.target.value);
  };

  return (
    <>
      <div className="grid">
        <div className="col-12">
          <input
            data-testid="cell-input"
            className="input-field"
            type="text"
            value={props.cellContent}
            onChange={(e) => {
              handleCellChange(e);
            }}
            onBlur={(e) => props.handleFocusOut(e)}
            onFocus={(e) => props.handleFocus(e)}
          ></input>
        </div>
      </div>
    </>
  );
}

export default InputField;
