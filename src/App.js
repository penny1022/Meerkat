//載入套件
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
//載入檔案
import Upload from "./pages/upload/index";
import ModelUpload from "./pages/ModelUpload/index";
import Home from "./pages/home";
import NewDataset from "./pages/newdataset";
import DatasetInfo from "./pages/datasetinfo";
import DatasetList from "./pages/datasetlist";

// 介面所需框架集合
function App() {
  return (
    <div className="test">
      <BrowserRouter>
        <Routes>
          <Route path="/" />
          <Route path="manage/" element={<Home />}/>
          <Route path="fileUpload" element={<Upload />} />
          <Route path="modelUpload" element={<ModelUpload />} />
          <Route path="edit/">
            <Route path="newDataset" element={<NewDataset />} />
          </Route>
          <Route path="test/" element={<DatasetInfo/>}/>
          <Route path="info/" element={<DatasetList/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
