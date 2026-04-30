/* ==================================================
WMN3 DNS PRO - FULL APP.JS
LOGIN + SESSION + ADMIN FULL ACCESS + GENERATORS
ADMIN CAN:
ADD / DELETE / EDIT / CHANGE ROLE / RESET PASS
BLOCK USER / FORCE LOGOUT / SEE HISTORY / SEARCH
================================================== */

let USERS = JSON.parse(localStorage.getItem("usersDB")) || [
{user:"admin",pass:"123456",role:"admin",online:false,lastSeen:"-",blocked:false},
{user:"user1",pass:"111111",role:"member",online:false,lastSeen:"-",blocked:false},
{user:"user2",pass:"222222",role:"member",online:false,lastSeen:"-",blocked:false}
];

let currentUser = null;

/* HELPERS */
function byId(id){ return document.getElementById(id); }

function saveUsers(){
localStorage.setItem("usersDB", JSON.stringify(USERS));
}

function now(){
return new Date().toLocaleString();
}

function lines(id){
return byId(id).value.split('\n').map(x=>x.trim()).filter(x=>x);
}

/* ======================
AUTO LOGIN
====================== */
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
}

/* ======================
LOGIN
====================== */
function login(){

let u = byId("username").value.trim();
let p = byId("password").value.trim();

let found = USERS.find(x=>x.user===u && x.pass===p);

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
}

/* ======================
OPEN DASHBOARD
====================== */
function openDashboard(user){

byId("loginPage").style.display="none";
byId("dashboard").style.display="block";

byId("welcome").innerHTML =
"👤 "+user.user+" ("+user.role+")";

renderStats();
renderHistory();

if(user.role==="admin"){
byId("adminPanel").style.display="block";
renderUsers();
renderAdminHistory();
}

}

/* ======================
LOGOUT
====================== */
function logout(){

if(currentUser){

let f = USERS.find(x=>x.user===currentUser.user);

if(f){
f.online=false;
f.lastSeen=now();
saveUsers();
}

}

localStorage.removeItem("activeUser");
location.reload();
}

/* ======================
STATS
====================== */
function renderStats(){

let total = USERS.length;
let online = USERS.filter(x=>x.online).length;

byId("statsGrid").innerHTML = `
<div class="stat-box"><div>Users</div><div class="num">${total}</div></div>
<div class="stat-box"><div>Online</div><div class="num">${online}</div></div>
<div class="stat-box"><div>Admins</div><div class="num">${USERS.filter(x=>x.role==="admin").length}</div></div>
<div class="stat-box"><div>Members</div><div class="num">${USERS.filter(x=>x.role==="member").length}</div></div>
`;
}

/* ======================
ADMIN USERS TABLE
====================== */
function renderUsers(){

let box = byId("usersTable");
if(!box) return;

box.innerHTML = "";

let search = "";
if(byId("searchUser")) search = byId("searchUser").value.toLowerCase();

USERS.forEach(u=>{

if(search && !u.user.toLowerCase().includes(search)) return;

let tr = document.createElement("tr");

tr.innerHTML = `
<td>${u.user}</td>
<td>${u.role}</td>
<td>${u.online?'🟢 Online':'🔴 Offline'}</td>
<td>${u.lastSeen}</td>
<td>
<button onclick="editUser('${u.user}')">Edit</button>
<button onclick="resetPass('${u.user}')">Pass</button>
<button onclick="changeRole('${u.user}')">Role</button>
<button onclick="forceLogout('${u.user}')">Logout</button>
<button onclick="toggleBlock('${u.user}')">${u.blocked?'Unblock':'Block'}</button>
<button onclick="clearUserHistory('${u.user}')">History</button>
<button onclick="deleteUser('${u.user}')">Delete</button>
</td>
`;

box.appendChild(tr);

});

}

/* ======================
ADD USER
====================== */
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

byId("newUser").value="";
byId("newPass").value="";
}

/* DELETE */
function deleteUser(name){

if(name==="admin") return alert("Cannot delete admin");

if(!confirm("Delete "+name+" ?")) return;

USERS = USERS.filter(x=>x.user!==name);

localStorage.removeItem("history_"+name);

saveUsers();
renderUsers();
renderStats();
renderAdminHistory();
}

/* EDIT USERNAME */
function editUser(name){

let f = USERS.find(x=>x.user===name);
if(!f) return;

let nn = prompt("New username:", f.user);
if(!nn) return;

let oldHistory = localStorage.getItem("history_"+name);
if(oldHistory){
localStorage.setItem("history_"+nn, oldHistory);
localStorage.removeItem("history_"+name);
}

f.user = nn;

saveUsers();
renderUsers();
renderAdminHistory();
}

/* RESET PASSWORD */
function resetPass(name){

let f = USERS.find(x=>x.user===name);
if(!f) return;

let np = prompt("New password:");
if(!np) return;

f.pass = np;

saveUsers();
alert("Password Changed");
}

/* CHANGE ROLE */
function changeRole(name){

let f = USERS.find(x=>x.user===name);
if(!f || name==="admin") return;

f.role = (f.role==="admin") ? "member" : "admin";

saveUsers();
renderUsers();
renderStats();
}

/* FORCE LOGOUT */
function forceLogout(name){

let f = USERS.find(x=>x.user===name);
if(!f) return;

f.online = false;
f.lastSeen = now();

saveUsers();
renderUsers();
}

/* BLOCK / UNBLOCK */
function toggleBlock(name){

let f = USERS.find(x=>x.user===name);
if(!f || name==="admin") return;

f.blocked = !f.blocked;

saveUsers();
renderUsers();
}

/* CLEAR HISTORY */
function clearUserHistory(name){

if(!confirm("Clear history of "+name+" ?")) return;

localStorage.removeItem("history_"+name);

renderAdminHistory();
}

/* ======================
USER HISTORY
====================== */
function saveHistory(result){

if(!currentUser) return;

let key = "history_"+currentUser.user;

let h = JSON.parse(localStorage.getItem(key)||"[]");

h.unshift({
date: now(),
data: result
});

h = h.slice(0,50);

localStorage.setItem(key, JSON.stringify(h));

renderHistory();

if(currentUser.role==="admin"){
renderAdminHistory();
}

}

function renderHistory(){

if(!currentUser) return;

let h = JSON.parse(localStorage.getItem("history_"+currentUser.user)||"[]");

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

let box = byId("historyAdminTable");
if(!box) return;

box.innerHTML="";

USERS.forEach(u=>{

let h = JSON.parse(localStorage.getItem("history_"+u.user)||"[]");

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

/* ======================
OUTPUT
====================== */
function setOutput(txt){
byId("output").value = txt.trim();
saveHistory(txt.trim());
}

function copyOutput(){
byId("output").select();
document.execCommand("copy");
}

/* ======================
GENERATORS
====================== */
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

/* START */
window.onload = autoLogin;
