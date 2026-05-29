function InputField(props: any) {
  return (
    <>
      <div className="grid">
        <div className="col-12">
          <input
            className="input-field"
            type="text"
            value={props.cellContent}
            onChange={(e) => props.setCellContent(e.target.value)}
          ></input>
        </div>
      </div>
    </>
  );
}

export default InputField;
