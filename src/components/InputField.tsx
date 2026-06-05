function InputField(props: any) {
  return (
    <>
      <div className="grid">
        <div className="col-12">
          <input
            className="input-field"
            type="text"
            defaultValue={props.cellContent}
            onBlur={props.handleChange}
          ></input>
        </div>
      </div>
    </>
  );
}

export default InputField;
