const keyMap = {};

document.addEventListener('keydown', (event) => {
  keyMap[event.key] = true;
});

document.addEventListener('keyup', (event) => {
  keyMap[event.key] = false;
});

export default keyMap;
