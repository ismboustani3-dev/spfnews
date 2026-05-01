/* ===========================
ADMIN FULL ACCESS VERSION
BADDEL BIH app.js KAMEL
=========================== */

let USERS = JSON.parse(localStorage.getItem("usersDB")) || [
{user:"admin",pass:"123456",role:"admin",online:false,lastSeen:"-",blocked:false},
{user:"user1",pass:"111111",role:"member",online:false,lastSeen:"-",blocked:false},
{user:"user2",pass:"222222",role:"member",online:false,lastSeen:"-",blocked:false}
];

let currentUser=null;

/* helpers */
function saveUsers(){
localStorage.setItem("usersDB",JSON.stringify(USERS));
}

function byId(id){
return document.getElementById(id);
}

function now(){
return new Date().toLocaleString();
}

function lines(id){
return byId(id).value.split('\n').map(x=>x.trim()).filter(x=>x);
}

function logAction(txt){
let logs=JSON.parse(localStorage.getItem("activityLogs")||"[]");
logs.unshift(now()+" - "+txt);
logs=logs.slice(0,200);
localStorage.setItem("activityLogs",JSON.stringify(logs));
renderLogs();
}

/* LOGIN */
function login(){

let u=byId("username").value.trim();
let p=byId("password").value.trim();

let found=USERS.find(x=>x.user===u && x.pass===p);

if(!found){
byId("errorMsg").innerText="Invalid Login";
return;
}

if(found.blocked){
byId("errorMsg").innerText="Account Blocked";
return;
}

currentUser=found;
found.online=true;
found.lastSeen=now();

saveUsers();

byId("loginPage").style.display="none";
byId("dashboard").style.display="block";
byId("welcome").innerHTML="👤 "+found.user+" ("+found.role+")";

renderStats();
renderHistory();

if(found.role==="admin"){
byId("adminPanel").style.display="block";
renderUsers();
renderAdminHistory();
renderLogs();
}

logAction(found.user+" logged in");
}

function logout(){

if(currentUser){
let f=USERS.find(x=>x.user===currentUser.user);
if(f){
f.online=false;
f.lastSeen=now();
saveUsers();
logAction(f.user+" logged out");
}
}

location.reload();
}

/* OUTPUT */
function setOutput(txt){
byId("output").value=txt.trim();
saveHistory(txt.trim());
}

function copyOutput(){
byId("output").select();
document.execCommand("copy");
alert("Copied");
}

/* HISTORY */
function saveHistory(result){

let key="history_"+currentUser.user;
let h=JSON.parse(localStorage.getItem(key)||"[]");

h.unshift({
date:now(),
data:result
});

h=h.slice(0,50);

localStorage.setItem(key,JSON.stringify(h));

renderHistory();
renderStats();

if(currentUser.role==="admin"){
renderAdminHistory();
}

logAction(currentUser.user+" generated records");
}

function renderHistory(){

let key="history_"+currentUser.user;
let h=JSON.parse(localStorage.getItem(key)||"[]");

byId("historyList").innerHTML="";

h.forEach(item=>{

let div=document.createElement("div");
div.className="history-item";
div.innerHTML=item.date;

div.onclick=()=>{
byId("output").value=item.data;
};

byId("historyList").appendChild(div);

});
}

function renderAdminHistory(){

let box=byId("historyAdminTable");
if(!box) return;

box.innerHTML="";

let search=byId("searchHistoryUser").value.toLowerCase().trim();

USERS.forEach(u=>{

if(search && !u.user.toLowerCase().includes(search)) return;

let h=JSON.parse(localStorage.getItem("history_"+u.user)||"[]");

h.forEach(item=>{

let prev=item.data.substring(0,80).replace(/\n/g," ");

let tr=document.createElement("tr");

tr.innerHTML=`
<td>${u.user}</td>
<td>${item.date}</td>
<td>${prev}...</td>
`;

box.appendChild(tr);

});

});
}

/* USERS TABLE */
function renderUsers(){

let box=byId("usersTable");
if(!box) return;

box.innerHTML="";

let search=byId("searchUser").value.toLowerCase().trim();

USERS.forEach(u=>{

if(search && !u.user.toLowerCase().includes(search)) return;

let tr=document.createElement("tr");

tr.innerHTML=`
<td>${u.user}</td>
<td>${u.role}</td>
<td>${u.online ? '🟢 Online':'🔴 Offline'}</td>
<td>${u.lastSeen}</td>
<td>
<button onclick="editUser('${u.user}')">Edit</button>
<button onclick="changeRole('${u.user}')">Role</button>
<button onclick="resetPass('${u.user}')">Pass</button>
<button onclick="forceLogout('${u.user}')">Logout</button>
<button onclick="clearUserHistory('${u.user}')">History</button>
<button onclick="blockUser('${u.user}')">${u.blocked?'Unblock':'Block'}</button>
<button class="red" onclick="deleteUser('${u.user}')">Delete</button>
</td>
`;

box.appendChild(tr);

});

}

/* ADMIN ACTIONS */

function addUser(){

let u=byId("newUser").value.trim();
let p=byId("newPass").value.trim();
let r=byId("newRole").value;

if(!u || !p) return;

if(USERS.find(x=>x.user===u)){
alert("User exists");
return;
}

USERS.push({
user:u,
pass:p,
role:r,
online:false,
lastSeen:"-",
blocked:false
});

saveUsers();
renderUsers();
renderStats();

logAction("admin added "+u);
}

function deleteUser(name){

if(name==="admin") return;

if(!confirm("Delete "+name+" ?")) return;

USERS=USERS.filter(x=>x.user!==name);

saveUsers();
renderUsers();
renderStats();

logAction("admin deleted "+name);
}

function editUser(name){

let f=USERS.find(x=>x.user===name);
if(!f) return;

let newName=prompt("New username:",f.user);

if(!newName) return;

f.user=newName;

saveUsers();
renderUsers();

logAction("admin edited username "+name+" => "+newName);
}

function resetPass(name){

let f=USERS.find(x=>x.user===name);
if(!f) return;

let np=prompt("New password:");

if(!np) return;

f.pass=np;

saveUsers();

logAction("admin changed password for "+name);
}

function changeRole(name){

let f=USERS.find(x=>x.user===name);
if(!f) return;

f.role=(f.role==="admin")?"member":"admin";

saveUsers();
renderUsers();

logAction("admin changed role for "+name);
}

function forceLogout(name){

let f=USERS.find(x=>x.user===name);
if(!f) return;

f.online=false;
f.lastSeen=now();

saveUsers();
renderUsers();

logAction("admin forced logout "+name);
}

function clearUserHistory(name){

if(!confirm("Clear history of "+name+" ?")) return;

localStorage.removeItem("history_"+name);

renderUsers();
renderAdminHistory();
renderStats();

logAction("admin cleared history of "+name);
}

function blockUser(name){

let f=USERS.find(x=>x.user===name);
if(!f) return;

f.blocked=!f.blocked;

saveUsers();
renderUsers();

logAction("admin toggled block for "+name);
}

/* LOGS */
function renderLogs(){

let box=byId("logsBox");
if(!box) return;

box.innerHTML="";

let logs=JSON.parse(localStorage.getItem("activityLogs")||"[]");

logs.forEach(x=>{

let div=document.createElement("div");
div.className="log-item";
div.innerHTML=x;

box.appendChild(div);

});
}

/* STATS */
function renderStats(){

let total=USERS.length;
let online=USERS.filter(x=>x.online).length;

let topUser="-";
let max=0;

USERS.forEach(u=>{
let h=JSON.parse(localStorage.getItem("history_"+u.user)||"[]");
if(h.length>max){
max=h.length;
topUser=u.user;
}
});

byId("statsGrid").innerHTML=`
<div class="stat-box"><div>Users</div><div class="num">${total}</div></div>
<div class="stat-box"><div>Online</div><div class="num">${online}</div></div>
<div class="stat-box"><div>Top User</div><div class="num">${topUser}</div></div>
<div class="stat-box"><div>Records</div><div class="num">${max}</div></div>
`;
}

/* EXPORT */
function exportTXT(){
download("output.txt",byId("output").value);
}

function exportCSV(){
download("output.csv",byId("output").value.replace(/\n/g,","));
}

function exportJSON(){
download("output.json",JSON.stringify({output:byId("output").value},null,2));
}

function download(name,data){

let blob=new Blob([data],{type:"text/plain"});
let a=document.createElement("a");

a.href=URL.createObjectURL(blob);
a.download=name;
a.click();
}

/* GENERATORS */
function generateSPF(){

let d=lines("spfDomains");
let s=lines("spfSubs");
let i=lines("spfIps");

let txt=i.map(ip=>"ip4:"+ip).join(" ");
let out="";

d.forEach(domain=>{
if(s.length){
s.forEach(sub=>{
out+=`${domain},${sub},TXT,"v=spf1 ${txt} -all"\n`;
});
}else{
out+=`${domain},${domain},TXT,"v=spf1 ${txt} -all"\n`;
}
});

setOutput(out);
}

function generateMX(){

let d=lines("mxDomains");
let s=lines("mxSubs");
let i=lines("mxIps").join(";");

let out="";

d.forEach(domain=>{
if(s.length){
s.forEach(sub=>{
out+=`${domain},${sub},TXT,MXrecords:${i}\n`;
});
}else{
out+=`${domain},${domain},TXT,MXrecords:${i}\n`;
}
});

setOutput(out);
}

function generateA(){

let d=lines("aDomains");
let s=lines("aSubs");
let i=lines("aIps").join(";");

let out="";

d.forEach(domain=>{
if(s.length){
s.forEach(sub=>{
out+=`${domain},${sub},TXT,Arecords:${i}\n`;
});
}else{
out+=`${domain},${domain},TXT,Arecords:${i}\n`;
}
});

setOutput(out);
}

function toggleTheme(){
document.body.classList.toggle("light");
}
