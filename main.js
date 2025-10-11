const {app,BrowserWindow}=require("electron");
app.whenReady().then(()=>{
  const w=new BrowserWindow({show:true});
  w.maximize();
  w.loadURL("https://attelier.vercel.app");
});
