import React from "react";
import "../index.css";

const ConRight = ({note, symptoms, title}) => {
  return (
    <div>
      <h2>{title}</h2>
      <div className="div">{note}</div>
      <div className="flex-container">
        <div className="dataleft">
          <h3 className="h3">DICOM索引檔</h3>
          <a href="google.com">{symptoms}</a><br/>
          <h6 className="h6">*需下載者請先提出申請文件</h6>
        </div>
        <div className="dataright">
          <h3 className="h3">其餘附加檔案</h3>
        </div>
      </div>
    </div>
  );
};

export default ConRight;