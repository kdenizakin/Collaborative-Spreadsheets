function InputField(props: any) {
  const onTodoChange = (value) => {
    props.setState({
      name: value,
    });
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
            onBlur={props.handleChange}
            onChange={(e) => props.handleChange(e)}
          ></input>
        </div>
      </div>
    </>
  );
}

export default InputField;
