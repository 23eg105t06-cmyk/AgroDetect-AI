import { useState } from "react";

export default function App() {

  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);

  const handleFile = (e) => {

    const selected = e.target.files[0];
    if(!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
  };

  const analyze = async () => {

    if(!file){
      alert("Upload image first");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try{
      const res = await fetch("http://127.0.0.1:8000/predict",{
        method:"POST",
        body:formData
      });

      const data = await res.json();
      setResult(data);

    }catch(err){
      alert("Backend error");
      console.log(err);
    }

    setLoading(false);
  };

  // ==========================
  // SEVERITY LOGIC
  // ==========================

  const getSeverity = () => {
    if(!result) return 0;
    return Math.round(result.confidence * 100);
  };

  const getColor = (value) => {

    if(value < 20) return "#22c55e";      // green
    if(value <= 50) return "#eab308";     // yellow
    return "#ef4444";                     // red
  };

  const getPrecaution = (value) => {

    if(value < 20)
      return "Low severity detected. Maintain proper watering and monitor plant regularly.";

    if(value <= 50)
      return "Moderate infection risk. Remove affected leaves and improve airflow.";

    return "High severity infection detected. Apply treatment immediately and isolate plant.";
  };

  const severity = getSeverity();

  return (

    <div style={styles.page}>

      {/* LEFT PANEL */}
      <div style={styles.left}>

        <h1>🌿 AgroDetect AI</h1>

        <label style={styles.uploadBox}>
          <input type="file" hidden onChange={handleFile}/>

          {preview ?
            <img src={preview} style={styles.preview}/>
            :
            <p>Click to Upload Leaf Image</p>
          }
        </label>

        <button style={styles.button} onClick={analyze}>
          Analyze Plant
        </button>

      </div>

      {/* RIGHT PANEL */}
      <div style={styles.right}>

        {!loading && !result && (
          <h2>AI Analysis Dashboard</h2>
        )}

        {loading && (
          <>
            <h2>🤖 AI scanning leaf...</h2>
            <div style={styles.scan}></div>
          </>
        )}

        {result && (

          <>
            <h2>{result.disease}</h2>

            {/* HEATMAP */}
            <img
              src={`data:image/jpeg;base64,${result.heatmap}`}
              style={styles.heatmap}
            />

            {/* SEVERITY METER */}
            <h3>Disease Severity</h3>

            <div style={styles.barOuter}>
              <div
                style={{
                  ...styles.barInner,
                  width:`${severity}%`,
                  background:getColor(severity)
                }}
              />
            </div>

            <p style={{marginTop:"10px",fontWeight:"bold"}}>
              Severity: {severity}%
            </p>

            {/* PRECAUTION MESSAGE */}
            <div style={styles.precautionBox}>
              {result.ai_text}
            </div>


          </>
        )}

      </div>

    </div>
  );
}

const styles = {

  page:{
    display:"flex",
    height:"100vh",
    background:"#020617",
    color:"white",
    fontFamily:"sans-serif"
  },

  left:{
    width:"35%",
    padding:"40px",
    borderRight:"1px solid #1e293b",
    textAlign:"center"
  },

  right:{
    width:"65%",
    padding:"40px",
    overflowY:"auto"
  },

  uploadBox:{
    border:"2px dashed #38bdf8",
    borderRadius:"12px",
    padding:"20px",
    cursor:"pointer",
    margin:"20px 0"
  },

  preview:{
    width:"100%",
    borderRadius:"10px"
  },

  button:{
    padding:"12px 20px",
    background:"#38bdf8",
    border:"none",
    borderRadius:"10px",
    cursor:"pointer",
    fontWeight:"bold"
  },

  heatmap:{
    width:"300px",
    borderRadius:"12px",
    marginBottom:"20px"
  },

  barOuter:{
    height:"20px",
    background:"#1e293b",
    borderRadius:"20px",
    overflow:"hidden"
  },

  barInner:{
    height:"100%",
    borderRadius:"20px",
    transition:"width 0.5s ease"
  },

  precautionBox:{
    marginTop:"20px",
    padding:"15px",
    background:"rgba(255,255,255,0.05)",
    borderRadius:"10px"
  },

  scan:{
    height:"4px",
    background:"linear-gradient(90deg,transparent,cyan,transparent)"
  }
};
