import firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/auth'
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

  firebase.app().auth().onAuthStateChanged(function(user) {
    if (user) {
      uid.trigger(user.uid)
    }
  })

  firebase.app().auth().signInAnonymously().catch(() => {
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
async function newStory(name: string, color?: string) {
  const uid = await getUID()
  const resp = await jsonPOST('newStory', {
    name: name,
    color: color,
    uid: uid
  })

  const story = new Story(resp.data.story.id)
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
    name: player.data.name,
    color: player.data.color,
  })
  return player
}

async function closeStory(storyId: string) {
  const uid = await getUID()
  await jsonPOST('closeStory', {
    uid: uid,
    storyId: storyId
  })
  return true
}

async function play(storyId: string, head: string, tail: string) {
  const uid = await getUID()
  await jsonPOST('play', {
    uid: uid,
    storyId: storyId,
    head: head,
    tail: tail
  })
  return true
}

interface SettableProperties {
  name?: string;
  color?: string;
}

async function updatePlayer(storyId: string, properties: SettableProperties) {
  const uid = await getUID()
  const data = {
    uid: uid,
    storyId: storyId,
    name: properties.name,
    color: properties.color,
  }
  console.log(properties)
  if (properties.name || properties.color) {

    await jsonPOST('updatePlayer', data)
  }
  return true
}

export {
  initialize,
  Story as Story,
  PlayerPrivate as Player,
  newStory,
  closeStory,
  play,
  registerPlayer,
  getUID,
  updatePlayer,
}
