import * as firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/auth'
//import * as crypto from 'crypto'
import axios from 'axios'
import { PlayerPrivate, Story, initializeCadex } from 'cadexlib'

const isDev = window.location.host.startsWith('localhost')
const databaseURL = (isDev) ? "http://localhost:9000/?ns=cadex-a057e": "https://cadex-a057e.firebaseio.com"
const functionURL = (isDev) ? "http://localhost:5001/cadex-a057e/us-central1/": "https://us-central1-cadex-a057e.cloudfunctions.net/"

const firebaseConfig = {
  apiKey: "AIzaSyC8rR63t7K3Spv97jNn7bvlq8EHVXB479s",
  authDomain: "cadex-a057e.firebaseapp.com",
  databaseURL: databaseURL,
  projectId: "cadex-a057e",
  storageBucket: "cadex-a057e.appspot.com",
  messagingSenderId: "633469560244",
  appId: "1:633469560244:web:1ff4dfdeef557038d47ee1"
}

/**
 * Enable trigger a promise from the outside
 *
 */
class Deffered<T> extends Promise<T> {
  private resolve: ((o: T) => void) | null

  constructor(fn?: (resolve: (x: T) => void, reject: (x: T) => void) => void) {
    if (fn) {
      super(fn)
      this.resolve = null
      return
    }
    let res = null
    const promise = new Promise<T>((resolve) => {
      res = resolve
    })
    super((resolve) => {
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

/**
 * The user (anonymous) id
 */
const uid = new Deffered<string>()

/**
 * Get asynchronously the User (anonymous) user id
 */
function getUID(): Promise<string> {
  return uid
}

/**
 * Initialize the backend
 */
function initialize() {
  console.log("Initialize backend")

  firebase.initializeApp(firebaseConfig)

  initializeCadex(firebase.database())

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      uid.trigger(user.uid)
    }
  })

  firebase.auth().signInAnonymously().catch(() => {
    return
  })
}

async function jsonPOST<T>(func: string, data: T) {
  const resp = await axios.post(functionURL + func, data, {
    headers: {
      'content-type': 'application/json'
    }
  })

  return resp
}

/**
 * Create a new story
 */
async function newStory(players: number) {
  const resp = await jsonPOST('newStory', {players: players})

  const story = new Story(resp.data.id)
  return story
}

/**
 * Register a player in a story
 */
async function registerPlayer(player: PlayerPrivate) {
  const uid = await getUID()
  await jsonPOST('newPlayer', {
    uid: uid,
    storyId: player.data.sid,
    name: player.data.name
  })
  return player
}

export {
  initialize,
  Story as Story,
  PlayerPrivate as Player,
  newStory,
  registerPlayer,
  getUID
}
