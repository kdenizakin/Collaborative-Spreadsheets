import { useState, useEffect } from "react";
import { Button } from "primereact/button";

function InputField() {
  const [content, setContent] = useState("");

  return (
    <>
      <div className="grid">
        <div className="col-12">
          <input
            className="input-field"
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></input>
        </div>
        {content !== "" && <p>{content}</p>}
      </div>
    </>
  );
}

export default InputField;
