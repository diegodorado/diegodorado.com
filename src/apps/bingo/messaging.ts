import * as Ably from 'ably';

const API_KEY = "Cw1Osw.n7MgNQ:VsOSP5o5Y-VAbC1t-Ub7nY_AhYS8rv7g9cSJwGswmKw"
const client2 = new Ably.Realtime(API_KEY);
const channel = client2.channels.get("bingo");

const pub = (topic: string, content: object) => {
  channel.publish(topic, content)
  console.log('pub', topic, content)
}

const sub = (topic: string, callback: (data: object) => void) => {
  channel.subscribe(topic, (d) => {
    console.log("GOT MSG", topic, d)
    callback(d.data)
  })
  console.log('sub', topic)
}

const unsub = (topic: string) => {
  channel.unsubscribe(topic)
  console.log('unsub', topic)
}

const client = {
  sub,
  pub,
  unsub,
}

export { client }
