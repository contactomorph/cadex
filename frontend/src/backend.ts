import * as firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/auth'
//import * as crypto from 'crypto'
import axios, {AxiosResponse} from 'axios'
import { PlayerPrivate, Story } from './cadex'

const firebaseConfig = {
  apiKey: "AIzaSyC8rR63t7K3Spv97jNn7bvlq8EHVXB479s",
  authDomain: "cadex-a057e.firebaseapp.com",
  //databaseURL: "https://cadex-a057e.firebaseio.com",
  databaseURL: "http://localhost:9000/?ns=cadex-a057e",
  //databaseURL: "http://localhost:9000/?ns=undefined",
  projectId: "cadex-a057e",
  storageBucket: "cadex-a057e.appspot.com",
  messagingSenderId: "633469560244",
  appId: "1:633469560244:web:1ff4dfdeef557038d47ee1"
}

class Deffered<T> extends Promise<T> {
  private resolve: ((o: T) => void) | null

  constructor(fn?: (resolve: (x: T) => void, reject: (x: T) => void) => void) {
    if (fn) {
      super(fn)
      this.resolve = null
      return
    }
    let res = null
    const promise = new Promise<T>((resolve, reject) => {
      res = resolve
    })
    super((resolve, reject) => {
      promise.then((x: T) => {
        resolve(x)
      })
    })
    this.resolve = res
  }

  public trigger(o: T) {
    if (this.resolve) {
      this.resolve(o)
    }
  }
}

const uuid = new Deffered<string>()

function getUID(): Promise<string> {
  return uuid
}

function initialize() {
  console.log("Initialize backend")

  firebase.initializeApp(firebaseConfig)

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      uuid.trigger(user.uid)
    }
  })

  firebase.auth().signInAnonymously().catch(() => {
    return
  })
}

class Chunk {
}

async function newStory(players: number) {
  const resp = await axios.post('http://localhost:5001/cadex-a057e/us-central1/newStory', {
    players: players
  }, {
    headers: {
      'content-type': 'application/json'
    }
  })

  const story = new Story(resp.data.id)
  return story
}

async function registerPlayer(player: PlayerPrivate) {
  const uid = await getUID()

  const resp = await axios.post('http://localhost:5001/cadex-a057e/us-central1/newPlayer', {
    uid: uid,
    storyId: player.data.sid,
    name: player.data.name
  }, {
    headers: {
      'content-type': 'application/json'
    }
  })
  return player
}

export {
  initialize,
  Story as Story,
  PlayerPrivate as Player,
  Chunk as Chunk,
  newStory,
  registerPlayer,
  getUID
}
