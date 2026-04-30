/* ==========================================================
WMN3 DNS PRO - FULL FINAL SCRIPT
LOGIN + USER CREATE FIX + DATABASE FIX + ADMIN + HISTORY
========================================================== */

/* ==========================
DATABASE INIT
========================== */
let USERS = [];
let currentUser = null;

function initUsers(){

let saved = localStorage.getItem("usersDB");

if(saved){

USERS = JSON.parse(saved);

}else{

USERS = [
{
user:"admin",
pass:"123456",
role:"admin",
online:false,
lastSeen:"-",
blocked:false
},
{
user:"user1",
pass:"111111",
role:"member",
online:false,
lastSeen:"-",
blocked:false
}
];

localStorage.setItem("usersDB", JSON.stringify(USERS));
}

}

/* ==========================
HELPERS
========================== */
function byId(id){
return document.getElementById(id);
}

function saveUsers(){
localStorage.setItem("usersDB", JSON.stringify(USERS));
}

function loadUsers(){
USERS = JSON.parse(localStorage.getItem("usersDB")) || [];
}

function now(){
return new Date().toLocaleString();
}

function lines(id){

let el = byId(id);
if(!el) return [];

return el.value
.split('\n')
.map(x=>x.trim())
.filter(x=>x);
}

/* ==========================
NOTIFY
Need HTML:
<div id="liveNotif"></div>
========================== */
function notify(msg){

let box = byId("liveNotif");
if(!box) return;

let div = document.createElement("div");
div.className = "toast";
div.innerText = msg;

box.appendChild(div);

setTimeout(()=>{
div.remove();
},3000);

}

/* ==========================
AUTO LOGIN
========================== */
function autoLogin(){

loadUsers();

let saved = localStorage.getItem("activeUser");
if(!saved) return;

let found = USERS.find(x=>x.user===saved);
if(!found) return;

currentUser = found;

found.online = true;
found.lastSeen = now();

saveUsers();

openDashboard(found);

}

/* ==========================
LOGIN
========================== */
function login(){

loadUsers();

let u = byId("username").value.trim();
let p = byId("password").value.trim();

let found = USERS.find(x =>
x.user.trim() === u &&
x.pass.trim() === p
);

if(!found){

if(byId("errorMsg"))
byId("errorMsg").innerText = "Invalid Login";

return;
}

if(found.blocked){

if(byId("errorMsg"))
byId("errorMsg").innerText = "Blocked User";

return;
}

currentUser = found;

localStorage.setItem("activeUser", found.user);

found.online = true;
found.lastSeen = now();

saveUsers();

openDashboard(found);

notify("🟢 "+found.user+" logged in");

}

/* ==========================
OPEN DASHBOARD
========================== */
function openDashboard(user){

if(byId("loginPage"))
byId("loginPage").style.display="none";

if(byId("dashboard"))
byId("dashboard").style.display="block";

if(byId("welcome"))
byId("welcome").innerHTML =
"👤 "+user.user+" ("+user.role+")";

renderStats();
renderHistory();

if(user.role==="admin"){

if(byId("adminPanel"))
byId("adminPanel").style.display="block";

renderUsers();
renderAdminHistory();

}

}

/* ==========================
LOGOUT
========================== */
function logout(){

if(currentUser){

let f = USERS.find(x=>x.user===currentUser.user);

if(f){

f.online=false;
f.lastSeen=now();

saveUsers();

}

notify("🔴 "+currentUser.user+" logged out");

}

localStorage.removeItem("activeUser");

setTimeout(()=>{
location.reload();
},500);

}

/* ==========================
STATS
========================== */
function renderStats(){

let box = byId("statsGrid");
if(!box) return;

box.innerHTML = `
<div class="stat-box"><div>Users</div><div class="num">${USERS.length}</div></div>
<div class="stat-box"><div>Online</div><div class="num">${USERS.filter(x=>x.online).length}</div></div>
<div class="stat-box"><div>Admins</div><div class="num">${USERS.filter(x=>x.role==="admin").length}</div></div>
<div class="stat-box"><div>Members</div><div class="num">${USERS.filter(x=>x.role==="member").length}</div></div>
`;

}

/* ==========================
ADD USER
========================== */
function addUser(){

loadUsers();

let u = byId("newUser").value.trim();
let p = byId("newPass").value.trim();
let r = byId("newRole").value;

if(!u || !p){
alert("Fill fields");
return;
}

if(USERS.find(x =>
x.user.toLowerCase() === u.toLowerCase()
)){
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

notify("➕ User created: "+u);

byId("newUser").value="";
byId("newPass").value="";

}

/* ==========================
DELETE USER
========================== */
function deleteUser(name){

if(name==="admin"){
alert("Cannot delete admin");
return;
}

USERS = USERS.filter(x=>x.user!==name);

localStorage.removeItem("history_"+name);

saveUsers();

renderUsers();
renderStats();
renderAdminHistory();

notify("🗑 User deleted: "+name);

}

/* ==========================
USERS TABLE
========================== */
function renderUsers(){

let box = byId("usersTable");
if(!box) return;

box.innerHTML = "";

USERS.forEach(u=>{

let tr = document.createElement("tr");

tr.innerHTML = `
<td>${u.user}</td>
<td>${u.role}</td>
<td>${u.online ? '🟢 Online':'🔴 Offline'}</td>
<td>${u.lastSeen}</td>
<td><button onclick="deleteUser('${u.user}')">Delete</button></td>
`;

box.appendChild(tr);

});

}

/* ==========================
HISTORY
========================== */
function saveHistory(result){

if(!currentUser) return;

let key = "history_"+currentUser.user;

let h = JSON.parse(
localStorage.getItem(key) || "[]"
);

h.unshift({
date:now(),
data:result
});

h = h.slice(0,50);

localStorage.setItem(
key,
JSON.stringify(h)
);

renderHistory();

if(currentUser.role==="admin"){
renderAdminHistory();
}

}

function renderHistory(){

if(!currentUser) return;

let box = byId("historyList");
if(!box) return;

let h = JSON.parse(
localStorage.getItem("history_"+currentUser.user)||"[]"
);

box.innerHTML = "";

h.forEach(item=>{

let div = document.createElement("div");
div.className="history-item";
div.innerHTML=item.date;

div.onclick=()=>{
if(byId("output"))
byId("output").value=item.data;
};

box.appendChild(div);

});

}

function renderAdminHistory(){

let box = byId("historyAdminTable");
if(!box) return;

box.innerHTML="";

USERS.forEach(u=>{

let h = JSON.parse(
localStorage.getItem("history_"+u.user)||"[]"
);

h.forEach(item=>{

let tr=document.createElement("tr");

tr.innerHTML=`
<td>${u.user}</td>
<td>${item.date}</td>
<td>${item.data.substring(0,70)}...</td>
`;

box.appendChild(tr);

});

});

}

/* ==========================
OUTPUT
========================== */
function setOutput(txt){

if(byId("output"))
byId("output").value = txt.trim();

saveHistory(txt.trim());

}

function copyOutput(){

let out = byId("output");
if(!out) return;

out.select();
document.execCommand("copy");

notify("📋 Copied");

}

/* ==========================
GENERATORS
========================== */
function generateSPF(){

let d = lines("spfDomains");
let s = lines("spfSubs");
let i = lines("spfIps");

let txt = i.map(ip=>"ip4:"+ip).join(" ");

let out="";

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

let out="";

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

let out="";

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

/* ==========================
START
========================== */
window.onload = function(){

initUsers();
autoLogin();

};
