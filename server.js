let express = require('express');
let http = require('http');
let config = require('./config/dev');
let services = require('./src/services');
let bodyParser = require('body-parser');

process.setMaxListeners(0);

class Server{
    constructor(){
        this.app = this._initExpress();
        this._run(this.app);
    }
    _run(app){
        this._initServices(app);
        let server = http.createServer(app);

        let port = config.port || 8081;
        server.listen(port, ()=>{ console.log(`Server start at ${port}`) });
    }
    _initExpress(){
        let app = express();

        app.use((req, res, next)=>{
            res.header('Access-Control-Allow-Credentials', true);
            res.header('Access-Control-Allow-Origin', req.headers.origin);
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Origin, Content-Type, Accept');
            if ('OPTIONS' === req.method) {
                res.send(200);
            } else {
                next();
            }
        });

        app.use(bodyParser.json());

        return app;
    }
    _initServices(app){
        services.forEach(service=>{
            new service(app);
        });
    }
}

new Server();