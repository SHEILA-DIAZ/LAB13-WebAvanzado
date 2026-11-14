import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtempSync,mkdirSync,writeFileSync,openSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {randomBytes} from "node:crypto";
import {DatabaseSync} from "node:sqlite";
const temp=mkdtempSync(join(tmpdir(),"lab13-test-")), out=resolve("evidencias-tarea");
mkdirSync(out,{recursive:true});
const base="http://localhost:3013", dbfile=join(temp,"auth.sqlite"), logfile=join(temp,"server.log");
const fd=openSync(logfile,"a");
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--port","3013"],{env:{...process.env,NEXTAUTH_URL:base,NEXTAUTH_SECRET:randomBytes(32).toString("hex"),AUTH_DB_PATH:dbfile},stdio:["ignore",fd,fd],windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms)), cookies=new Map(), checks=[];
let chrome,ws,db;
const ok=(name,value)=>{assert.ok(value,name);checks.push(name);console.log("OK: "+name)};
async function request(path,options={}){
 const headers=new Headers(options.headers);
 headers.set("Cookie",[...cookies].map(([k,v])=>k+"="+v).join("; "));
 const r=await fetch(base+path,{...options,headers,redirect:"manual"});
 for(const c of r.headers.getSetCookie()){const p=c.split(";")[0],i=p.indexOf("=");cookies.set(p.slice(0,i),p.slice(i+1))}
 return r;
}
async function csrf(){return (await(await request("/api/auth/csrf")).json()).csrfToken}
async function login(email,password){
 const r=await request("/api/auth/callback/credentials",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Origin:base},body:new URLSearchParams({csrfToken:await csrf(),email,password,json:"true",callbackUrl:base+"/dashboard"})});
 return new URL((await r.json()).url,base).searchParams.get("error");
}
async function logout(){await request("/api/auth/signout",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Origin:base},body:new URLSearchParams({csrfToken:await csrf(),json:"true"})})}
const register=(data,origin=base)=>request("/api/register",{method:"POST",headers:{"Content-Type":"application/json",Origin:origin},body:JSON.stringify(data)});
let nextId=0; const pending=new Map();
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++nextId;const timer=setTimeout(()=>{pending.delete(id);reject(new Error("CDP timeout "+method))},15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value}
async function wait(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(100)}throw new Error("Timeout navegador: "+expression)}
async function navigate(path){await call("Page.navigate",{url:base+path});await pause(500);await wait("document.readyState==='complete' && !!document.querySelector('main')");await pause(300)}
async function screenshot(name){const r=await call("Page.captureScreenshot",{format:"png"});writeFileSync(join(out,name+".png"),Buffer.from(r.data,"base64"))}
async function input(id,value){await evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`)}
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+"/signin")).ok)break}catch{}if(i===99)throw new Error(readFileSync(logfile,"utf8").slice(-4000));await pause(300)}
 ok("Perfil y dashboard privados",(await request("/profile")).status===307&&(await request("/dashboard")).status===307);
 const user={name:"Estudiante LAB13",email:"laboratorio13@ejemplo.test",password:randomBytes(16).toString("hex")};
 ok("Registro rechaza origen externo",(await register(user,"https://otro.test")).status===403);
 ok("Registro rechaza clave corta",(await register({...user,password:"123"})).status===400);
 ok("Registro rechaza exceso de 72 bytes",(await register({...user,password:"a".repeat(73)})).status===400);
 ok("Registro crea usuario",(await register(user)).status===201);
 ok("Correo duplicado normalizado rechazado",(await register({...user,email:" LABORATORIO13@EJEMPLO.TEST "})).status===409);
 db=new DatabaseSync(dbfile);
 const stored=db.prepare("SELECT * FROM users WHERE email=?").get(user.email);
 ok("Hash bcrypt coste 12 sin texto plano",/^\$2[aby]\$12\$/.test(stored.password_hash)&&stored.password_hash!==user.password);
 ok("Inicio con correo normalizado",await login(user.email.toUpperCase(),user.password)===null);
 const session=await(await request("/api/auth/session")).json();
 ok("Sesion identifica al usuario y proveedor",session.user.email===user.email&&session.provider==="credentials"&&!JSON.stringify(session).includes("password"));
 ok("Perfil permite usuario autenticado",(await request("/profile")).status===200);
 await logout();
 ok("Cerrar sesion vuelve a proteger perfil",(await request("/profile")).status===307);
 ok("Clave incorrecta rechazada",await login(user.email,"incorrecta")==="CredentialsSignin");
 ok("Clave correcta reinicia contador",await login(user.email,user.password)===null&&db.prepare("SELECT failed_attempts FROM users WHERE id=?").get(stored.id).failed_attempts===0);
 await logout();
 for(let i=1;i<=5;i++)ok("Intento fallido "+i,await login(user.email,"incorrecta")===(i===5?"AccountLocked":"CredentialsSignin"));
 const locked=db.prepare("SELECT * FROM users WHERE id=?").get(stored.id);
 ok("Bloqueo persistente de 15 minutos",locked.failed_attempts===5&&locked.locked_until>Date.now()+14*60000);
 ok("Clave correcta no evita bloqueo",await login(user.email,user.password)==="AccountLocked");
 ok("Cuenta inexistente da error generico",await login("desconocido@ejemplo.test",user.password)==="CredentialsSignin");
 const providers=await(await request("/api/auth/providers")).json();ok("CredentialsProvider registrado",!!providers.credentials);
 chrome=spawn(process.env.CHROME_PATH??"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",["--headless","--disable-gpu","--disable-extensions","--no-first-run","--remote-debugging-port=9233","--user-data-dir="+join(temp,"chrome"),"about:blank"],{stdio:"ignore",windowsHide:true});
 chrome.on("error",()=>{});
 let target;
 for(let i=0;i<80;i++){try{target=(await(await fetch("http://localhost:9233/json")).json()).find(t=>t.type==="page");if(target)break}catch{}await pause(250)}
 assert.ok(target,"Chrome no disponible");
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.addEventListener("open",r,{once:true});ws.addEventListener("error",j,{once:true})});
 ws.addEventListener("message",e=>{const m=JSON.parse(String(e.data)),p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result)});
 await call("Page.enable");await call("Network.enable");
 await call("Emulation.setDeviceMetricsOverride",{width:1366,height:1000,deviceScaleFactor:1,mobile:false});
 await navigate("/register");await input("name","Estudiante LAB13");await input("email","captura13@ejemplo.test");await input("password",user.password);await input("confirmPassword",user.password);await screenshot("01-registro");
 await evaluate("document.querySelector('form').requestSubmit()");
 await wait("location.pathname==='/signin'&&location.search.includes('registered=1')");
 ok("Registro desde el formulario",await evaluate("!!document.querySelector('[role=status]')"));await screenshot("02-acceso");
 await input("email","captura13@ejemplo.test");await input("password",user.password);await evaluate("document.querySelector('form').requestSubmit()");
 await wait("location.pathname==='/dashboard'&&document.body.innerText.includes('Estudiante LAB13')");
 ok("Acceso desde el formulario",true);await screenshot("03-dashboard");
 await navigate("/profile");await wait("document.body.innerText.includes('Correo y contraseña')");await screenshot("04-perfil");
 await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Cerrar sesión').click()");
 await wait("location.pathname==='/signin'");ok("Boton cerrar sesion",true);await screenshot("05-sesion-cerrada");
 await input("email",user.email);await input("password",user.password);await evaluate("document.querySelector('form').requestSubmit()");
 await wait("document.querySelector('[role=alert]')?.textContent.includes('Cuenta bloqueada')");ok("Formulario muestra bloqueo real",true);await screenshot("06-bloqueo");
 db.prepare("UPDATE users SET locked_until=? WHERE id=?").run(Date.now()-1,stored.id);
 ok("Acceso tras vencer bloqueo",await login(user.email,user.password)===null);
 ok("Contador limpio tras desbloqueo",db.prepare("SELECT failed_attempts FROM users WHERE id=?").get(stored.id).failed_attempts===0);
 writeFileSync(join(out,"resultados.json"),JSON.stringify({checks,providers:Object.keys(providers),oauthLiveTested:false,date:new Date().toISOString()},null,2));
 console.log("Pruebas completas. Evidencias: "+out);
}catch(e){console.error(e);console.error("Log: "+logfile);process.exitCode=1}
finally{db?.close();ws?.close();chrome?.kill();server.kill()}
