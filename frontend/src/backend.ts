import * as firebase from 'firebase/app'
import { v4 as uuid } from 'uuid'

const firebaseConfig = {
  apiKey: "AIzaSyC8rR63t7K3Spv97jNn7bvlq8EHVXB479s",
  authDomain: "cadex-a057e.firebaseapp.com",
  databaseURL: "https://cadex-a057e.firebaseio.com",
  projectId: "cadex-a057e",
  storageBucket: "cadex-a057e.appspot.com",
  messagingSenderId: "633469560244",
  appId: "1:633469560244:web:1ff4dfdeef557038d47ee1"
}

function initialize() {
  console.log("Initialize backend")
  firebase.initializeApp(firebaseConfig)
}

let story: Story

class Chunk {
  head = ''
  tail = ''
  player: Player

  constructor(player: Player, head: string, tail: string) {
    this.head = head
    this.tail = tail
    this.player = player
  }
}

type MyTurn = ((player: Player, tail: string) => void) | null
type NewTurn = ((player: Player) => void) | null
type TheEnd = ((chunks: Array<Chunk>) => void) | null

class Player {
  readonly id: string
  public name: string
  public played = false
  story: Story
  myTurnCallback: MyTurn = null

  /* just for debug */
  head = ''
  tail = ''

  constructor(name: string, story: Story) {
    this.id = uuid()
    this.name = name
    this.story = story
  }

  play(head: string, tail: string) {
    this.head = head
    this.tail = tail
    this.played = true
    this.story.turn()
  }

  setMyTurnCallback(callback: MyTurn) {
    this.myTurnCallback = callback
  }

  myTurn(tail: string) {
    if(this.myTurnCallback) {
      this.myTurnCallback(this, tail)
    }
  }
}

enum StoryState {
  Starting = 0,
  Registering,
  Writting,
  End
}


class Story {
  /* Public attributes */
  readonly id: string
  players: Array<Player> = []
  playerNumber = 0
  state = StoryState.Starting

  /* Private attributes */
  private newTurnCallback: NewTurn = null
  private theEndCallback: TheEnd = null

  /* Constructor */
  constructor(players: number) {
    this.id = uuid()
    this.playerNumber = players
    this.state = StoryState.Registering
  }

  /* Public methods */
  addPlayer(name: string) {
    if(this.state!==StoryState.Registering) {
      throw "Story is not ready to add player"
    }
    const player = new Player(name, this);
    this.players.push(player)
    if(this.players.length == this.playerNumber) {
      this.start()
    }
    return player
  }

  setNewTurnCallback(callback: NewTurn) {
    this.newTurnCallback = callback
  }

  setTheEndCallback(callback: TheEnd) {
    this.theEndCallback = callback
  }

  get url(): string {
    return "http://localhost/"+this.id
  }

  /* Private methods */

  public turn(): void {
    if(this.state!==StoryState.Writting) {
      throw "Story is not ready to progress"
    }
    let tail = ''
    for(const player of this.players) {
      if(!player.played) {
        if(this.newTurnCallback) {
          this.newTurnCallback(player)
        }
        player.myTurn(tail)
        return
      } else {
        tail = player.tail
      }
    }
    if(this.theEndCallback) {
      const chunks: Array<Chunk> = []
      for(const player of this.players) {
        chunks.push(new Chunk(player, player.head, player.tail))
      }
      this.theEndCallback(chunks)
    }
  }

  private start(): void {
    this.state = StoryState.Writting
    setTimeout(() => {
      console.log("Start playing")
      this.turn()
    }, 1000)
  }

}

function startStory(players: number) {
  story = new Story(players)
  return story
}

function joinStory() {
  throw 'Not implemented'
}

/* Simulate the game */

function AI(me: Player, tail: string) {
  me.play("("+tail+")" + me.name + " head", me.name + " tail")
}

function simulPlayer(name: string, add: number) {
  setTimeout(function() {
    const player = story.addPlayer(name)
    player.setMyTurnCallback(AI)
  }, add)
}



export {
  initialize,
  story,
  startStory,
  joinStory,
  Player as Player,
  Chunk as Chunk,
  simulPlayer
}
