let USERS = JSON.parse(localStorage.getItem("usersDB")) || [
{user:"admin",pass:"123456",role:"admin",online:false,lastSeen:"-"},
{user:"user1",pass:"111111",role:"member",online:false,lastSeen:"-"},
{user:"user2",pass:"222222",role:"member",online:false,lastSeen:"-"}
];

let currentUser = null;

/* ---------- HELPERS ---------- */
function saveUsers(){
localStorage.setItem("usersDB", JSON.stringify(USERS));
}

function byId(id){
return document.getElementById(id);
}

function lines(id){
return byId(id).value
.split('\n')
.map(x=>x.trim())
.filter(x=>x);
}

function now(){
return new Date().toLocaleString();
}

function toast(msg){
alert(msg);
}

function downloadFile(name, content, type="text/plain"){
const blob = new Blob([content], {type});
const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = name;
a.click();
URL.revokeObjectURL(a.href);
}

/* ---------- LOGS ---------- */
function addLog(txt){
let logs = JSON.parse(localStorage.getItem("activityLogs") || "[]");
logs.unshift(now()+" - "+txt);
logs = logs.slice(0,100);
localStorage.setItem("activityLogs", JSON.stringify(logs));
renderLogs();
}

function renderLogs(){
const box = byId("logsBox");
if(!box) return;

let logs = JSON.parse(localStorage.getItem("activityLogs") || "[]");
box.innerHTML = "";

logs.forEach(x=>{
let div = document.createElement("div");
div.className = "log-item";
div.textContent = x;
box.appendChild(div);
});
}

/* ---------- LOGIN ---------- */
function login(){
let u = byId("username").value.trim();
let p = byId("password").value.trim();

let found = USERS.find(x=>x.user===u && x.pass===p);

if(found){
currentUser = found;
found.online = true;
found.lastSeen = now();
saveUsers();

byId("loginPage").style.display = "none";
byId("dashboard").style.display = "block";
byId("welcome").innerHTML = "👤 "+found.user+" ("+found.role+")";

renderStats();
renderHistory();

if(found.role.toLowerCase()==="admin"){
byId("adminPanel").style.display = "block";
renderUsers();
renderAdminHistory();
renderLogs();
}

addLog(found.user+" logged in");

}else{
byId("errorMsg").innerText = "Invalid username or password";
}
}

function logout(){
if(currentUser){
let f = USERS.find(x=>x.user===currentUser.user);
if(f){
f.online = false;
f.lastSeen = now();
saveUsers();
addLog(f.user+" logged out");
}
}
location.reload();
}

/* ---------- STATS ---------- */
function renderStats(){
let total = USERS.length;
let online = USERS.filter(x=>x.online).length;

let all = 0;
USERS.forEach(u=>{
let h = JSON.parse(localStorage.getItem("history_"+u.user) || "[]");
all += h.length;
});

let topUser = "-";
let topCount = -1;

USERS.forEach(u=>{
let h = JSON.parse(localStorage.getItem("history_"+u.user) || "[]");
if(h.length > topCount){
topCount = h.length;
topUser = u.user;
}
});

byId("statsGrid").innerHTML = `
<div class="stat-box"><div>Users</div><div class="num">${total}</div></div>
<div class="stat-box"><div>Online</div><div class="num">${online}</div></div>
<div class="stat-box"><div>Total Logs</div><div class="num">${all}</div></div>
<div class="stat-box"><div>Top User</div><div class="num">${topUser}</div></div>
`;
}

/* ---------- HISTORY ---------- */
function saveHistory(result){
if(!currentUser) return;

let key = "history_"+currentUser.user;
let h = JSON.parse(localStorage.getItem(key) || "[]");

h.unshift({
date: now(),
data: result
});

h = h.slice(0,30);

localStorage.setItem(key, JSON.stringify(h));

renderHistory();
renderStats();

if(currentUser.role==="admin"){
renderAdminHistory();
}

addLog(currentUser.user+" generated records");
}

function renderHistory(){
let key = "history_"+currentUser.user;
let h = JSON.parse(localStorage.getItem(key) || "[]");

byId("historyList").innerHTML = "";

h.forEach(item=>{
let div = document.createElement("div");
div.className = "history-item";
div.innerHTML = item.date;
div.onclick = ()=> byId("output").value = item.data;
byId("historyList").appendChild(div);
});
}

function renderAdminHistory(){
const box = byId("historyAdminTable");
if(!box) return;

box.innerHTML = "";

let search = byId("searchHistoryUser").value.toLowerCase().trim();

USERS.forEach(u=>{

if(search && !u.user.toLowerCase().includes(search)) return;

let h = JSON.parse(localStorage.getItem("history_"+u.user) || "[]");

h.forEach(item=>{
let tr = document.createElement("tr");
let prev = item.data.substring(0,80).replace(/\n/g," ");

tr.innerHTML = `
<td>${u.user}</td>
<td>${item.date}</td>
<td>${prev}...</td>
`;

box.appendChild(tr);
});

});
}

/* ---------- USERS ---------- */
function addUser(){
let u = byId("newUser").value.trim();
let p = byId("newPass").value.trim();
let r = byId("newRole").value;

if(!u || !p) return toast("Fill fields");

if(USERS.find(x=>x.user===u)) return toast("User exists");

USERS.push({
user:u,
pass:p,
role:r,
online:false,
lastSeen:"-"
});

saveUsers();
renderUsers();
renderStats();

byId("newUser").value = "";
byId("newPass").value = "";

addLog("admin added user "+u);
}

function deleteUser(name){
if(name==="admin") return;

USERS = USERS.filter(x=>x.user!==name);
saveUsers();

renderUsers();
renderStats();
renderAdminHistory();

addLog("admin deleted user "+name);
}

function renderUsers(){
const box = byId("usersTable");
if(!box) return;

box.innerHTML = "";

let search = byId("searchUser").value.toLowerCase().trim();

USERS.forEach(u=>{

if(search && !u.user.toLowerCase().includes(search)) return;

let tr = document.createElement("tr");

tr.innerHTML = `
<td>${u.user}</td>
<td>${u.role}</td>
<td class="${u.online?'status-on':'status-off'}">${u.online?'Online':'Offline'}</td>
<td>${u.lastSeen}</td>
<td><button class="red" onclick="deleteUser('${u.user}')">Delete</button></td>
`;

box.appendChild(tr);
});
}

/* ---------- OUTPUT ---------- */
function setOutput(txt){
byId("output").value = txt.trim();
saveHistory(txt.trim());
}

function copyOutput(){
byId("output").select();
document.execCommand("copy");
toast("Copied");
}

/* ---------- EXPORT ---------- */
function exportTXT(){
downloadFile("output.txt", byId("output").value);
}

function exportCSV(){
let rows = byId("output").value.split("\n").join(",");
downloadFile("output.csv", rows, "text/csv");
}

function exportJSON(){
let data = {output: byId("output").value};
downloadFile("output.json", JSON.stringify(data,null,2), "application/json");
}

/* ---------- GENERATORS ---------- */
function generateSPF(){
let d = lines("spfDomains");
let s = lines("spfSubs");
let i = lines("spfIps");

let txt = i.map(ip=>"ip4:"+ip).join(" ");
let out = "";

d.forEach(domain=>{
if(s.length){
s.forEach(sub=>{
out += `${domain},${sub},TXT,"v=spf1 ${txt} -all"\n`;
});
}else{
out += `${domain},${domain},TXT,"v=spf1 ${txt} -all"\n`;
}
});

setOutput(out);
}

function generateMX(){
let d = lines("mxDomains");
let s = lines("mxSubs");
let i = lines("mxIps").join(";");

let out = "";

d.forEach(domain=>{
if(s.length){
s.forEach(sub=>{
out += `${domain},${sub},TXT,MXrecords:${i}\n`;
});
}else{
out += `${domain},${domain},TXT,MXrecords:${i}\n`;
}
});

setOutput(out);
}

function generateA(){
let d = lines("aDomains");
let s = lines("aSubs");
let i = lines("aIps").join(";");

let out = "";

d.forEach(domain=>{
if(s.length){
s.forEach(sub=>{
out += `${domain},${sub},TXT,Arecords:${i}\n`;
});
}else{
out += `${domain},${domain},TXT,Arecords:${i}\n`;
}
});

setOutput(out);
}

/* ---------- THEME ---------- */
function toggleTheme(){
document.body.classList.toggle("light");
}
