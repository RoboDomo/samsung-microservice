//  https://developer.samsung.com/smarttv/develop/extension-libraries/smart-view-sdk/receiver-apps/debugging.html

const debug = require("debug")("SamsungHost"),
  superagent = require("superagent"),
  WebSocket = require("ws");

const POLL_TIMEOUT = 500;

const wait = async ms => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

class Samsung {
  constructor(config) {
    const appName_base64 = btoa(config.appName);
    this.config = Object.assign(
      {
        appName: "samsung-robodomo",
        appName_base64: appName_base64,
        ip: "192.168.4.32",
        token: null,
        powerPort: 9110, // 9110, 9119, 9197
        url:
          "ws://" +
          config.ip +
          ":8001/api/v2/channels/samsung.remote.control?name=" +
          appName_base64
      },
      config
    );
    this.appName = config.appName || "NodeJS-Test";
  }

  async send(command, callback) {
    const url = this.config.token
      ? this.config.url + "&token=" + this.config.token
      : this.config.url;
    console.log("send ", url);
    const ws = new WebSocket(url, { rejectUnauthorized: false });
    ws.on("open", async () => {
      console.log("OPEN");
      setTimeout(() => {
        ws.send(
          JSON.stringify({
            method: "ms.application.get",
            params: [],
            // method: "ms.application.get",
            id: Date.now()
          })
        );
      }, 1000);
      // setTimeout(() => ws.send(JSON.stringify(command), 1000));
    });
    ws.on("error", error => {
      console.log("ws error: ", error);
    });
    ws.on("message", message => {
      // console.log("ws message: ", message, "flags:", flags);
      const result = JSON.parse(message);
      // if (result.data.token) {
      //   this.config.token = result.data.token;
      // }
      // ws.close();
      callback(result);
    });
    ws.on("close", message => {
      console.log("SOCKET CLOSED");
    });
  }

  async run() {
    const url = "http://" + this.config.ip + ":" + this.config.powerPort;
    console.log("ip", this.config.ip, this.config.powerPort, url);
    let lastState = null;
    for (;;) {
      try {
        // console.log("poll", url);
        const result = await superagent.get(url).timeout(POLL_TIMEOUT);
        console.log("result", result);
        if (lastState === false || lastState === null) {
          console.log("power on xxx");
        }
        lastState = true;
      } catch (e) {
        // console.log("lastState", lastState, "exception", e);
        if (e.code === "EHOSTUNREACH" || e.code === "ECONNABORTED") {
          if (lastState != e.code) {
            console.log(Date.now() / 1000, "power off", e.code);
          }
        } else {
          if (lastState !== e.code) {
            console.log(Date.now() / 1000, "power on", e.code);
          }
        }
        lastState = e.code;
      }
      await wait(500);
    }
  }
}

// const { Samsung, KEYS, APPS } = require("samsung-tv-control");

const config = {
  debug: true,
  ip: "192.168.4.32",
  macAddress: "5c497d22f462",
  appName: "NodeJS-Test",
  port: 8001 // default 8002
  // token: "0000"
};

const main = async () => {
  //  const response = await request.get('http://192.168.4.32:8001/api/v2/');
  //  console.log('response', response.body);

  const tv = new Samsung(config);
  tv.run();
  await tv.send("KEY_HOME", message => {
    console.log("callback", message);
    // console.log(message.data.clients);
  });
  await tv.send("KEY_HOME", message => {
    console.log("callback2", message);
    // console.log(message.data.clients);
  });
  // console.log("connect");
  // await tv.connect();
  // console.log("returned");
};

main();
