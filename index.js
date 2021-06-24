//  https://developer.samsung.com/smarttv/develop/extension-libraries/smart-view-sdk/receiver-apps/debugging.html

process.env.DEBUG = "SamsungHost,HostBase,Samsung";
process.title = process.env.TITLE || "samsung-microservice";

const debug = require("debug")("SamsungHost"),
  Samsung = require("./lib/Samsung"),
  HostBase = require("microservice-core/HostBase");

const TOPIC_ROOT = process.env.TOPIC_ROOT || "samsung",
  MQTT_HOST = process.env.MQTT_HOST;

class SamsungHost extends HostBase {
  constructor(config) {
    super(MQTT_HOST, TOPIC_ROOT + "/" + config.device);
    this.config = config;
    this.samsung = new Samsung(config);
  }

  async send(key, cb) {
    return this.samsung.sendKey(key, cb);
  }

  async getHostInfo() {
    return await this.samsung.getHostInfo();
  }

  async run() {
    this.state = { info: this.info, input: this.config.input };
    let lastState = null;
    for (;;) {
      const power = await this.samsung.getPowerState();
      if (!this.info && power) {
        this.info = await this.samsung.getHostInfo();
      }
      this.state = { power: power };
      if (power !== lastState) {
        debug("power", power);
      }
      lastState = power;
      await this.wait(500);
    }
  }

  async command(topic, command) {
    debug("command", command);
    switch (command.toLowerCase()) {
      case "hdmi":
        this.state = { input: "hdmi1" };
        command = "KEY_HDMI";
        break;
      case "return":
        command = "KEY_RETURN";
        break;
      case "display":
        command = "KEY_INFO";
        break;
      case "home":
        command = "KEY_HOME";
        break;
      case "menu":
        command = "KEY_MENU";
        break;
      case "wakeup":
      case "poweron":
      case "poweroff":
        this.samsung.setPower(!this.state.power);
        return;
      case "volumeup":
        command = "KEY_VOLUP";
        break;
      case "volumedown":
        command = "KEY_VOLDOWN";
        break;
      case "mute":
        command = "KEY_MUTE";
        break;
      case "cursorup":
        command = "KEY_UP";
        break;
      case "cursordown":
        command = "KEY_DOWN";
        break;
      case "cursorleft":
        command = "KEY_LEFT";
        break;
      case "cursorright":
        command = "KEY_RIGHT";
        break;
      case "confirm":
        command = "KEY_ENTER";
        break;
      case "num0":
        command = "KEY_0";
        break;
      case "num1":
        command = "KEY_1";
        break;
      case "num2":
        command = "KEY_2";
        break;
      case "num3":
        command = "KEY_3";
        break;
      case "num4":
        command = "KEY_4";
        break;
      case "num5":
        command = "KEY_5";
        break;
      case "num6":
        command = "KEY_6";
        break;
      case "num7":
        command = "KEY_7";
        break;
      case "num8":
        command = "KEY_8";
        break;
      case "num9":
        command = "KEY_9";
        break;
      case "channelup":
        command = "KEY_CHUP";
        break;
      case "channeldown":
        command = "KEY_CHDOWN";
        break;
      case "clear":
        command = "KEY_CLEAR";
        break;
      case "enter":
        command = "KEY_ENTER";
        break;
      default:
        return;
    }
    // const packet = {
    //   method: "ms.remote.control",
    //   params: {
    //     Cmd: "Click",
    //     DataOfCmd: command,
    //     Option: "false",
    //     TypeOfRemote: "SendRemoteKey"
    //   }
    // };

    await this.send(command, message => {
      if (message.event === "ms.channel.clientConnect") {
        message.data = null;
      }
      debug("send command callback", message);
    });
  }
}

const config = {
  debug: true,
  device: "samsung-tv-monitor",
  ip: "192.168.4.32",
  input: "hdmi 2",
  macAddress: "5c497d22f462",
  appName: "samsung-microservice",
  port: 8001 // default 8002
  // token: "0000"
};

const main = async () => {
  const Config = await HostBase.config(),
    tvs = Config.samsung.tvs;
  console.log("tvs", tvs);
  for (const config of tvs) {
    const tv = new SamsungHost(config);
    tv.run();
  }
};

main();
