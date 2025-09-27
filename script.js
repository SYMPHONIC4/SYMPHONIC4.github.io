body {
cursor: pointer;
font-weight: bold;
}


.card {
background: white;
padding: 20px;
margin: 20px;
border-radius: 12px;
box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}


.hidden { display: none; }


input, textarea, button {
display: block;
margin: 10px 0;
padding: 10px;
width: 100%;
border: 1px solid #ccc;
border-radius: 8px;
font-size: 1rem;
}


button {
background: #7e57c2;
color: white;
border: none;
cursor: pointer;
transition: 0.3s;
}


button:hover {
background: #5e35b1;
}


#records-list li {
padding: 8px;
border-bottom: 1px solid #ddd;
}


@media print {
nav, #search { display: none; }
body { background: white; }
}
