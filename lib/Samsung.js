/**
 * Samsung class
 *
 * Instantiate this class to monitor and control Samsung TVs.
 *
 * Known Issues:
 * 1) I have found no way to determine the current source/input on the TV
 *    (e.g. HDMI1, HDMI2, ...).
 * 2) The KEY_HDMI1, KEY_HDMI2, KEY_HDMI3, KEY_HDMI4 keys do not select the
 *    expected HDMI input.  However, KEY_HDMI does cycle through the HDMI inputs,
 *    as well as TV+ (on my TV).
 * 3) HDMI selection might be doable using a sequence of keys
 *    (home, then right, then right...).
 * 4) Only supports the newer TVs that support WebSocket API.
 *
 */

const debug = require("debug")("Samsung"),
  console = require("console"),
  wol = require("wol"),
  superagent = require("superagent"),
  WebSocket = require("ws");

const POLL_TIMEOUT = 500;

class Samsung {
  constructor(config) {
    this.lastState = null;
    const appName_base64 = btoa(config.appName);
    this.config = Object.assign(
      {
        appName: "samsung-robodomo",
        appName_base64: appName_base64,
        token: null,
        powerPort: 9110, // 9110, 9119, 9197
        url:
          "ws://" +
          config.device +
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

    debug("send ", url);

    const ws = new WebSocket(url, { rejectUnauthorized: false });
    ws.on("open", async () => {
      setTimeout(() => {
        const json = JSON.stringify(command);
        ws.send(json);
      }, 200);
    });

    ws.on("error", error => {
      debug("ws error: ", error);
    });

    ws.on("message", message => {
      debug("ws message: ", JSON.stringify(message).substr(0, 60));
      const result = JSON.parse(message);
      // if (result.data.token) {
      //   this.config.token = result.data.token;
      // }
      // ws.close();
      callback(result);
    });

    ws.on("response", message => {
      debug("ws response: ", message);
    });

    ws.on("close", message => {
      debug("SOCKET CLOSED");
    });
  }

  async sendKey(key, cb) {
    const packet = {
      method: "ms.remote.control",
      params: {
        Cmd: "Click",
        DataOfCmd: key,
        Option: "false",
        TypeOfRemote: "SendRemoteKey"
      }
    };

    await this.send(packet, cb);
  }

  async setPower(state) {
    if (state) {
      const result = await wol.wake(this.config.macAddress);
      debug("wol", this.config.macAddress, result);
      return result;
    } else {
      debug("powerKey", this.config.powerKey);
      await this.sendKey(this.config.powerKey, () => {});
    }
    return state;
  }

  async getHostInfo() {
    const url = `http://${this.config.device}:8001/api/v2/`;
    console.log("getHostInfo url", url);
    try {
      const response = await superagent.get(url);
      debug("getHostInfo response", response.body);
      return response.body;
    } catch (e) {
      console.log("getHostInfo error", e);
      return null;
    }
  }

  async getPowerState() {
    const url = "http://" + this.config.device + ":" + this.config.powerPort;
    try {
      const result = await superagent.get(url).timeout(1000);
      // if (this.lastState === false || this.lastState === null) {
      //   debug("power on xxx", result);
      // }
      this.lastState = true;
      return true;
    } catch (e) {
      // console.log("e.code", e.code);
      if (e.code === "EHOSTUNREACH" || e.code === "ECONNABORTED") {
        // if (this.lastState != e.code) {
        //   debug(Date.now() / 1000, "power off", e.code);
        // }
        this.lastState = e.code;
        return false;
      } else {
        // if (this.lastState !== e.code) {
        //   debug(Date.now() / 1000, "power on", e.code);
        // }
        this.lastState = e.code;
        return true;
      }
    }
  }
}

// const { Samsung, KEYS, APPS } = require("samsung-tv-control");
module.exports = Samsung;
