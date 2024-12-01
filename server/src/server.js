import express from 'express';
import path from 'path';
import  { fileURLToPath } from 'url';
import config from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import indexRouter from '../routes/index.js'
import generatorRouter from '../routes/generator.js'

var app = express();

app.set('env', process.env.NODE_ENV || 'development');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/generator', generatorRouter);

// catch 404 and forward to error handler..
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  if (!res.headersSent) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
  } else {
    console.error('Error: Headers already sent. Cannot set error message.');
  }
});

// --- SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
