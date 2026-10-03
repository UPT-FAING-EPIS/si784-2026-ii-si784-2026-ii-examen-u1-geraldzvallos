const { createApp } = require('./app');
const port = process.env.PORT || 3000;
createApp().listen(port, () => console.log(`API de Lavanderia escuchando en el puerto ${port}`));
