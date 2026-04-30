/* =====================================================
WMN3 DNS PRO
FULL APP.JS + LIVE NOTIFICATIONS
Replace old app.js with this file
===================================================== */

let USERS = JSON.parse(localStorage.getItem("usersDB")) || [
{user:"admin",pass:"123456",role:"admin",online:false,lastSeen:"-",blocked:false},
{user:"user1",pass:"111111",role:"member",online:false,lastSeen:"-",blocked:false},
{user:"user2",pass:"222222",role:"member",online:false,lastSeen:"-",blocked:false}
];

let currentUser = null;

/* ==========================
HELPERS
========================== */
function byId(id){
return document.getElementById(id);
}

function saveUsers(){
localStorage.setItem("usersDB", JSON.stringify(USERS));
}

function now(){
return new Date().toLocaleString();
}

function lines(id){
return byId(id).value
.split('\n')
.map(x=>x.trim())
.filter(x=>x);
}

/* ==========================
LIVE NOTIFICATIONS
Need in HTML:
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

let saved = localStorage.getItem("activeUser");
if(!saved) return;

let found = USERS.find(x=>x.user===saved);
if(!found) return;

currentUser = found;
found.online = true;
found.lastSeen = now();

saveUsers();
openDashboard(found);

notify("🟢 "+found.user+" session restored");

}

/* ==========================
LOGIN
========================== */
function login(){

let u = byId("username").value.trim();
let p = byId("password").value.trim();

let found = USERS.find(x =>
x.user===u && x.pass===p
);

if(!found){
byId("errorMsg").innerText = "Invalid Login";
return;
}

if(found.blocked){
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

byId("loginPage").style.display = "none";
byId("dashboard").style.display = "block";

byId("welcome").innerHTML =
"👤 "+user.user+" ("+user.role+")";

renderStats();
renderHistory();

if(user.role==="admin"){
byId("adminPanel").style.display = "block";
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
f.online = false;
f.lastSeen = now();
saveUsers();
}

notify("🔴 "+currentUser.user+" logged out");

}

localStorage.removeItem("activeUser");

setTimeout(()=>{
location.reload();
},600);

}

/* ==========================
STATS
========================== */
function renderStats(){

let total = USERS.length;
let online = USERS.filter(x=>x.online).length;
let admins = USERS.filter(x=>x.role==="admin").length;
let members = USERS.filter(x=>x.role==="member").length;

byId("statsGrid").innerHTML = `
<div class="stat-box"><div>Users</div><div class="num">${total}</div></div>
<div class="stat-box"><div>Online</div><div class="num">${online}</div></div>
<div class="stat-box"><div>Admins</div><div class="num">${admins}</div></div>
<div class="stat-box"><div>Members</div><div class="num">${members}</div></div>
`;

}

/* ==========================
ADMIN USERS
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
<td>${u.online?'🟢 Online':'🔴 Offline'}</td>
<td>${u.lastSeen}</td>
<td>
<button onclick="deleteUser('${u.user}')">Delete</button>
</td>
`;

box.appendChild(tr);

});

}

function addUser(){

let u = byId("newUser").value.trim();
let p = byId("newPass").value.trim();
let r = byId("newRole").value;

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

notify("➕ User added: "+u);

byId("newUser").value="";
byId("newPass").value="";
}

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
HISTORY
========================== */
function saveHistory(result){

if(!currentUser) return;

let key = "history_"+currentUser.user;

let h = JSON.parse(
localStorage.getItem(key)||"[]"
);

h.unshift({
date: now(),
data: result
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

let key = "history_"+currentUser.user;

let h = JSON.parse(
localStorage.getItem(key)||"[]"
);

byId("historyList").innerHTML = "";

h.forEach(item=>{

let div = document.createElement("div");
div.className = "history-item";
div.innerHTML = item.date;

div.onclick = ()=>{
byId("output").value = item.data;
};

byId("historyList").appendChild(div);

});

}

function renderAdminHistory(){

let box = byId("historyAdminTable");
if(!box) return;

box.innerHTML = "";

USERS.forEach(u=>{

let h = JSON.parse(
localStorage.getItem("history_"+u.user)||"[]"
);

h.forEach(item=>{

let tr = document.createElement("tr");

tr.innerHTML = `
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

byId("output").value = txt.trim();
saveHistory(txt.trim());

}

function copyOutput(){

let out = byId("output");
out.select();
document.execCommand("copy");

notify("📋 Output copied");

}

/* ==========================
GENERATORS
========================== */
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
notify("⚙ SPF generated");

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
notify("⚙ MX generated");

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
notify("⚙ A Records generated");

}

/* START */
window.onload = autoLogin;
