const response = await fetch("https://codepen.io/aisyahnrlh/pen/eYMmdaO.html");
const text = await response.text();
console.log(text);
